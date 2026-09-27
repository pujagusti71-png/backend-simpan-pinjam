import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Risk Scoring Engine + Decision Support System.
 *
 * Menggabungkan semua faktor dari alur (poin 8-15):
 *  - Rasio cicilan terhadap penghasilan
 *  - Riwayat pembayaran (persentase keterlambatan)
 *  - Data SLIK / BI-checking (status BI, kolektibilitas, riwayat macet)
 *  - Pinjaman eksternal & stabilitas keuangan (saldo rata-rata vs pengeluaran)
 *  - Perilaku pinjaman (frekuensi pengajuan, jumlah pinjaman aktif bersamaan)
 *
 * Hasilnya sebuah skor risiko 0-100 dan rekomendasi keputusan
 * (approve / review / reject), disimpan ke tabel RisikoNasabah supaya bisa
 * dipakai ulang oleh modul lain (pre-loan checking, laporan, dsb).
 */
@Injectable()
export class AnalisisRisikoService {
    constructor(private prisma: PrismaService) { }

    private clamp(value: number, min = 0, max = 100) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Skor kontribusi dari rasio cicilan terhadap penghasilan.
     * Bobot 30 dari total 100.
     */
    private scoreRasioCicilan(rasioPersen: number) {
        if (rasioPersen <= 0) return 0;
        if (rasioPersen <= 30) return (rasioPersen / 30) * 15; // aman, kontribusi kecil
        if (rasioPersen <= 50) return 15 + ((rasioPersen - 30) / 20) * 15; // mulai berat
        return 30; // >50% penghasilan habis untuk cicilan -> maksimal
    }

    /**
     * Skor kontribusi dari riwayat pembayaran (persentase keterlambatan).
     * Bobot 25 dari total 100.
     */
    private scoreRiwayatPembayaran(persentaseKeterlambatan: number) {
        return this.clamp((persentaseKeterlambatan / 100) * 25, 0, 25);
    }

    /**
     * Skor kontribusi dari data SLIK / BI-checking.
     * Bobot 20 dari total 100.
     */
    private scoreSlik(riwayatKredit: { statusBI: string; kolektibilitas: string; pernahMacet: boolean } | null) {
        if (!riwayatKredit) return 5; // data belum ada -> sedikit risiko ketidakpastian
        let skor = 0;
        if (riwayatKredit.statusBI?.toLowerCase() === 'bermasalah') skor += 12;
        if (riwayatKredit.pernahMacet) skor += 8;
        const kolektibilitas = riwayatKredit.kolektibilitas?.toLowerCase() ?? '';
        if (/(^|\s)(3|4|5|c|d|macet|diragukan|kurang lancar)(\s|$)/.test(kolektibilitas)) {
            skor += 5;
        }
        return this.clamp(skor, 0, 20);
    }

    /**
     * Skor kontribusi dari stabilitas keuangan: saldo rata-rata vs estimasi
     * pengeluaran + cicilan berjalan, dicampur sedikit dengan risiko jenis
     * pekerjaan (proxy stabilitas penghasilan).
     * Bobot 15 dari total 100.
     */
    private scoreStabilitasKeuangan(params: {
        saldoRataRata: number | null;
        estimasiPengeluaran: number | null;
        penghasilan: number;
        cicilanBulanan: number;
        skorRisikoPekerjaan: number | null;
    }) {
        const { saldoRataRata, estimasiPengeluaran, penghasilan, cicilanBulanan, skorRisikoPekerjaan } = params;

        let skor = 0;

        const sisaPenghasilan = penghasilan - (estimasiPengeluaran ?? 0) - cicilanBulanan;
        if (sisaPenghasilan < 0) {
            skor += 8;
        } else if (penghasilan > 0 && sisaPenghasilan / penghasilan < 0.1) {
            skor += 4;
        }

        if (saldoRataRata !== null && saldoRataRata !== undefined) {
            const bufferBulan = cicilanBulanan > 0 ? saldoRataRata / cicilanBulanan : 3;
            if (bufferBulan < 1) skor += 4;
        }

        // Proxy stabilitas dari kategori risiko pekerjaan (0-100), diskalakan kecil
        skor += ((skorRisikoPekerjaan ?? 50) / 100) * 3;

        return this.clamp(skor, 0, 15);
    }

    /**
     * Skor kontribusi dari perilaku pinjaman: frekuensi pengajuan dan jumlah
     * pinjaman aktif (internal + eksternal) yang berjalan bersamaan.
     * Bobot 10 dari total 100.
     */
    private scorePerilakuPinjaman(frekuensiPinjaman: number, penjumlahPeminjamanAktif: number) {
        let skor = 0;
        if (frekuensiPinjaman >= 3) skor += 6;
        else if (frekuensiPinjaman === 2) skor += 3;

        if (penjumlahPeminjamanAktif >= 3) skor += 4;
        else if (penjumlahPeminjamanAktif === 2) skor += 2;

        return this.clamp(skor, 0, 10);
    }

    private buildIndikasiBehavior(frekuensiPinjaman: number, penjumlahPeminjamanAktif: number): string | null {
        const indikasi: string[] = [];
        if (frekuensiPinjaman >= 3) {
            indikasi.push(`Mengajukan pinjaman ${frekuensiPinjaman}x dalam 30 hari terakhir`);
        }
        if (penjumlahPeminjamanAktif >= 3) {
            indikasi.push(`Memiliki ${penjumlahPeminjamanAktif} pinjaman aktif (internal + eksternal) secara bersamaan`);
        }
        return indikasi.length > 0 ? indikasi.join('; ') : null;
    }

    private kategoriFromSkor(skor: number): 'rendah' | 'sedang' | 'tinggi' {
        if (skor <= 30) return 'rendah';
        if (skor <= 60) return 'sedang';
        return 'tinggi';
    }

    private rekomendasiFromSkor(skor: number): 'approve' | 'review' | 'reject' {
        if (skor <= 40) return 'approve';
        if (skor <= 70) return 'review';
        return 'reject';
    }

    /**
     * Hitung ulang & simpan skor risiko komposit untuk satu nasabah.
     */
    async recomputeForNasabah(nasabahId: number) {
        const nasabah = await this.prisma.nasabah.findUnique({
            where: { id: nasabahId },
            include: {
                pinjaman: { include: { pembayaran: true } },
                riwayatKredit: { orderBy: { updatedAt: 'desc' }, take: 1 },
                peminjamanEksternal: true,
            },
        });

        if (!nasabah) {
            throw new NotFoundException(`Nasabah dengan id ${nasabahId} tidak ditemukan`);
        }

        const pinjamanAktif = nasabah.pinjaman.filter((p) => p.status === 'active' || p.status === 'pending');
        const totalCicilanAktif = pinjamanAktif.reduce((sum, p) => sum + Number(p.cicilanBulanan ?? 0), 0);
        const rasioCicilan = nasabah.penghasilan > 0 ? (totalCicilanAktif / nasabah.penghasilan) * 100 : 0;

        const semuaPembayaran = nasabah.pinjaman.flatMap((p) => p.pembayaran);
        const totalPembayaran = semuaPembayaran.length;
        const totalTelat = semuaPembayaran.filter((pb) => pb.statusBayar === 'telat').length;
        const persentaseKeterlambatan = totalPembayaran > 0 ? (totalTelat / totalPembayaran) * 100 : 0;

        const riwayatKredit = nasabah.riwayatKredit[0] ?? null;

        const tigaPuluhHariLalu = new Date();
        tigaPuluhHariLalu.setDate(tigaPuluhHariLalu.getDate() - 30);
        const frekuensiPinjaman = nasabah.pinjaman.filter((p) => new Date(p.tanggalPengajuan) >= tigaPuluhHariLalu).length;
        const penjumlahPeminjamanAktif = pinjamanAktif.length + nasabah.peminjamanEksternal.length;

        const skorRasio = this.scoreRasioCicilan(rasioCicilan);
        const skorRiwayat = this.scoreRiwayatPembayaran(persentaseKeterlambatan);
        const skorSlik = this.scoreSlik(riwayatKredit);
        const skorStabilitas = this.scoreStabilitasKeuangan({
            saldoRataRata: nasabah.saldoRataRata ?? null,
            estimasiPengeluaran: nasabah.estimasiPengeluaran ?? null,
            penghasilan: nasabah.penghasilan,
            cicilanBulanan: totalCicilanAktif,
            skorRisikoPekerjaan: nasabah.skorRisikoPekerjaan ?? null,
        });
        const skorPerilaku = this.scorePerilakuPinjaman(frekuensiPinjaman, penjumlahPeminjamanAktif);

        const totalSkor = Math.round(this.clamp(skorRasio + skorRiwayat + skorSlik + skorStabilitas + skorPerilaku));
        const kategoriRisiko = this.kategoriFromSkor(totalSkor);
        const rekomendasi = this.rekomendasiFromSkor(totalSkor);
        const indikasiBehaviorBerisiko = this.buildIndikasiBehavior(frekuensiPinjaman, penjumlahPeminjamanAktif);

        const result = await this.prisma.risikoNasabah.upsert({
            where: { nasabahId },
            update: {
                rasioSiklusPersentase: Math.round(rasioCicilan * 100) / 100,
                skorRisiko: totalSkor,
                kategoriRisiko,
                persentaseKeterlambatan: Math.round(persentaseKeterlambatan * 100) / 100,
                frekuensiPinjaman,
                penjumlahPeminjamanAktif,
                indikasiBehaviorBerisiko,
                rekomendasi,
            },
            create: {
                nasabahId,
                rasioSiklusPersentase: Math.round(rasioCicilan * 100) / 100,
                skorRisiko: totalSkor,
                kategoriRisiko,
                persentaseKeterlambatan: Math.round(persentaseKeterlambatan * 100) / 100,
                frekuensiPinjaman,
                penjumlahPeminjamanAktif,
                indikasiBehaviorBerisiko,
                rekomendasi,
            },
        });

        return {
            ...result,
            breakdown: {
                skorRasioCicilan: Math.round(skorRasio * 100) / 100,
                skorRiwayatPembayaran: Math.round(skorRiwayat * 100) / 100,
                skorSlik: Math.round(skorSlik * 100) / 100,
                skorStabilitasKeuangan: Math.round(skorStabilitas * 100) / 100,
                skorPerilakuPinjaman: Math.round(skorPerilaku * 100) / 100,
            },
        };
    }

    /**
     * Hitung ulang skor risiko untuk seluruh nasabah yang punya data pinjaman.
     */
    async recomputeAll() {
        const nasabahList = await this.prisma.nasabah.findMany({ select: { id: true } });
        let success = 0;
        for (const { id } of nasabahList) {
            try {
                await this.recomputeForNasabah(id);
                success++;
            } catch (error) {
                console.error(`Gagal menghitung risiko nasabah ${id}:`, error);
            }
        }
        return { message: 'Perhitungan ulang skor risiko selesai', totalNasabah: nasabahList.length, success };
    }

    /**
     * GET /analisis-risiko - daftar skor risiko + rekomendasi semua nasabah.
     */
    async findAll() {
        const data = await this.prisma.risikoNasabah.findMany({
            include: {
                nasabah: {
                    select: {
                        id: true,
                        nama: true,
                        nik: true,
                        pekerjaan: true,
                        penghasilan: true,
                    },
                },
            },
            orderBy: { skorRisiko: 'desc' },
        });

        return data.map((item) => ({
            id: item.id,
            nasabahId: item.nasabahId,
            namaNasabah: item.nasabah.nama,
            nik: item.nasabah.nik,
            pekerjaan: item.nasabah.pekerjaan,
            penghasilan: item.nasabah.penghasilan,
            rasioCicilan: item.rasioSiklusPersentase,
            persentaseKeterlambatan: item.persentaseKeterlambatan,
            frekuensiPinjaman: item.frekuensiPinjaman,
            penjumlahPeminjamanAktif: item.penjumlahPeminjamanAktif,
            indikasiBehaviorBerisiko: item.indikasiBehaviorBerisiko,
            totalSkor: item.skorRisiko,
            kategoriRisiko: item.kategoriRisiko,
            status: item.rekomendasi,
            updatedAt: item.updatedAt,
        }));
    }

    async findByNasabah(nasabahId: number) {
        const existing = await this.prisma.risikoNasabah.findUnique({ where: { nasabahId } });
        if (!existing) {
            return this.recomputeForNasabah(nasabahId);
        }
        return existing;
    }
}
