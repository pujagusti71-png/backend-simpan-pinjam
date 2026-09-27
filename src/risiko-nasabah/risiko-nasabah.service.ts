import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RisikoNasabahService {
    constructor(private prisma: PrismaService) {}

    // ─────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────

    /** Konversi kolektibilitas ke label & apakah bermasalah */
    private parseKolektibilitas(kode: string): { label: string; bermasalah: boolean } {
        const k = (kode || '').toUpperCase().trim();
        const map: Record<string, { label: string; bermasalah: boolean }> = {
            A: { label: 'Lancar', bermasalah: false },
            '1': { label: 'Lancar', bermasalah: false },
            B: { label: 'Dalam Perhatian Khusus', bermasalah: false },
            '2': { label: 'Dalam Perhatian Khusus', bermasalah: false },
            C: { label: 'Kurang Lancar', bermasalah: true },
            '3': { label: 'Kurang Lancar', bermasalah: true },
            D: { label: 'Diragukan', bermasalah: true },
            '4': { label: 'Diragukan', bermasalah: true },
            E: { label: 'Macet', bermasalah: true },
            '5': { label: 'Macet', bermasalah: true },
        };
        return map[k] ?? { label: `Tidak diketahui (${kode})`, bermasalah: false };
    }

    /** Hitung skor dari jenis pekerjaan (0-30) */
    private getSkorPekerjaan(pekerjaan: string): number {
        const map: Record<string, number> = {
            pns: 3, 'tni/polri': 3, 'pegawai bumn': 4, 'guru/dosen': 5,
            'tenaga medis': 5, 'pegawai bank': 5, 'karyawan swasta tetap': 7,
            profesional: 8, pensiunan: 8, satpam: 9,
            'karyawan kontrak': 12, 'pegawai honorer': 14, 'buruh pabrik': 13,
            'sales/marketing': 13, sopir: 13, 'tukang bangunan/teknisi/mekanik': 13,
            'wirausaha/pengusaha/umkm/pedagang': 14, kurir: 14,
            'cleaning service': 14, 'petani/pekebun/peternak': 17,
            nelayan: 18, 'driver ojol': 18, art: 18, freelance: 19,
            mahasiswa: 27, 'buruh harian': 20, 'belum bekerja': 29,
        };
        const key = (pekerjaan || '').toLowerCase().trim();
        return map[key] ?? 15; // default: sedang
    }

    /** Hitung skor dari rasio cicilan / penghasilan (0-30) */
    private getSkorRasioCicilan(rasio: number): number {
        if (rasio <= 20) return 5;
        if (rasio <= 30) return 10;
        if (rasio <= 40) return 15;
        if (rasio <= 50) return 20;
        if (rasio <= 60) return 25;
        return 30; // > 60% sangat berisiko
    }

    /** Hitung skor dari riwayat pembayaran (0-25) */
    private getSkorRiwayat(totalBayar: number, telatBayar: number): number {
        if (totalBayar === 0) return 10; // belum ada riwayat
        const pct = (telatBayar / totalBayar) * 100;
        if (pct === 0) return 0;
        if (pct <= 10) return 8;
        if (pct <= 25) return 15;
        if (pct <= 50) return 20;
        return 25;
    }

    /** Hitung skor dari pinjaman eksternal/SLIK (0-10) */
    private getSkorPinjamanEksternal(
        jumlahPinjamanAktif: number,
        pernahMacet: boolean,
    ): number {
        let skor = 0;
        if (pernahMacet) skor += 7;
        if (jumlahPinjamanAktif >= 4) skor += 3;
        else if (jumlahPinjamanAktif >= 2) skor += 1;
        return Math.min(skor, 10);
    }

    /** Hitung skor dari perilaku pinjaman (0-10) */
    private getSkorBehavior(
        frekuensiPinjaman: number,
        pinjamanAktif: number,
        persentaseTelat: number,
    ): number {
        let skor = 0;
        // Frekuensi pinjaman berulang dalam periode pendek
        if (frekuensiPinjaman >= 5) skor += 4;
        else if (frekuensiPinjaman >= 3) skor += 2;
        // Pinjaman aktif banyak sekaligus
        if (pinjamanAktif >= 3) skor += 3;
        else if (pinjamanAktif >= 2) skor += 1;
        // Pola keterlambatan berulang
        if (persentaseTelat >= 50) skor += 3;
        else if (persentaseTelat >= 25) skor += 1;
        return Math.min(skor, 10);
    }

    /** Konversi total skor ke kategori */
    private getKategori(skor: number): 'rendah' | 'sedang' | 'tinggi' {
        if (skor < 35) return 'rendah';
        if (skor < 60) return 'sedang';
        return 'tinggi';
    }

    /** Konversi total skor ke rekomendasi */
    private getRekomendasi(skor: number): 'approve' | 'review' | 'reject' {
        if (skor < 35) return 'approve';
        if (skor < 60) return 'review';
        return 'reject';
    }

    /** Deteksi indikasi perilaku berisiko */
    private detectBehaviorFlags(
        frekuensiPinjaman: number,
        pinjamanAktif: number,
        persentaseTelat: number,
        pernahMacet: boolean,
    ): string | null {
        const flags: string[] = [];
        if (frekuensiPinjaman >= 5) flags.push(`Frekuensi pinjaman sangat tinggi (${frekuensiPinjaman}x)`);
        else if (frekuensiPinjaman >= 3) flags.push(`Frekuensi pinjaman tinggi (${frekuensiPinjaman}x)`);
        if (pinjamanAktif >= 4) flags.push(`Pinjaman aktif terlalu banyak (${pinjamanAktif} aktif)`);
        if (persentaseTelat >= 50) flags.push(`Lebih dari 50% pembayaran terlambat`);
        else if (persentaseTelat >= 25) flags.push(`Pola keterlambatan pembayaran (${persentaseTelat.toFixed(1)}%)`);
        if (pernahMacet) flags.push('Riwayat kredit macet terdeteksi di SLIK');
        return flags.length > 0 ? flags.join('; ') : null;
    }

    // ─────────────────────────────────────────────────────────────
    // BI CHECKING SUMMARY
    // ─────────────────────────────────────────────────────────────

    async getBICheckingSummary(nasabahId: number) {
        const nasabah = await this.prisma.nasabah.findUnique({
            where: { id: nasabahId },
            select: { id: true, nama: true, nik: true },
        });
        if (!nasabah) throw new NotFoundException(`Nasabah ID ${nasabahId} tidak ditemukan`);

        const eksternalList = await this.prisma.peminjamanEksternal.findMany({
            where: { nasabahId },
        });

        const totalJumlahEksternal = eksternalList.reduce(
            (sum, e) => sum + Number(e.jumlahPinjaman ?? 0),
            0,
        );
        const kolektibilitasList = eksternalList.map((e) => e.kolektibilitas);
        const pernahMacet = eksternalList.some(
            (e) => this.parseKolektibilitas(e.kolektibilitas).bermasalah,
        );
        const statusBI = pernahMacet ? 'bermasalah' : 'aman';

        let catatan: string | null = null;
        const macetEntries = eksternalList
            .filter((e) => this.parseKolektibilitas(e.kolektibilitas).bermasalah)
            .map((e) => `${e.sumberPinjaman} (Kolektibilitas ${e.kolektibilitas})`);
        if (macetEntries.length > 0) {
            catatan = `Pinjaman bermasalah: ${macetEntries.join(', ')}`;
        }

        return {
            nasabahId,
            nama: nasabah.nama,
            nik: nasabah.nik,
            totalPinjamanAktif: eksternalList.length,
            totalJumlahEksternal,
            statusBI,
            pernahMacet,
            kolektibilitasList,
            catatan,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // RASIO CICILAN PER NASABAH
    // ─────────────────────────────────────────────────────────────

    async getRasioCicilan(nasabahId: number) {
        const nasabah = await this.prisma.nasabah.findUnique({
            where: { id: nasabahId },
            select: {
                id: true,
                nama: true,
                penghasilan: true,
                pinjaman: {
                    where: { status: 'active' },
                    select: { id: true, jumlahPinjaman: true, cicilanBulanan: true, status: true },
                },
            },
        });
        if (!nasabah) throw new NotFoundException(`Nasabah ID ${nasabahId} tidak ditemukan`);

        const totalCicilanAktif = nasabah.pinjaman.reduce(
            (sum, p) => sum + Number(p.cicilanBulanan ?? 0),
            0,
        );
        const penghasilan = Number(nasabah.penghasilan ?? 0);
        const rasio = penghasilan > 0 ? (totalCicilanAktif / penghasilan) * 100 : 0;

        let statusRasio: string;
        if (rasio <= 30) statusRasio = 'Aman';
        else if (rasio <= 50) statusRasio = 'Perhatian';
        else statusRasio = 'Berisiko Tinggi';

        return {
            nasabahId,
            nama: nasabah.nama,
            penghasilan,
            totalCicilanAktif: Math.round(totalCicilanAktif),
            rasio: Math.round(rasio * 100) / 100,
            statusRasio,
            pinjamanAktif: nasabah.pinjaman.length,
            detail: nasabah.pinjaman,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // PRE-LOAN CHECKING
    // ─────────────────────────────────────────────────────────────

    async preLoanCheck(
        nasabahId: number,
        jumlahPinjaman: number,
        tenor: number,
        jenisBunga: 'flat' | 'efektif' = 'flat',
    ) {
        const nasabah = await this.prisma.nasabah.findUnique({
            where: { id: nasabahId },
            select: {
                id: true,
                nama: true,
                penghasilan: true,
                pekerjaan: true,
                riwayatPembayaran: true,
                pinjaman: {
                    where: { status: 'active' },
                    select: { cicilanBulanan: true },
                },
            },
        });
        if (!nasabah) throw new NotFoundException(`Nasabah ID ${nasabahId} tidak ditemukan`);

        // Hitung estimasi cicilan baru
        const sukuBunga = this.getDefaultBunga(jumlahPinjaman);
        const estimasiCicilan = this.hitungCicilan(jumlahPinjaman, sukuBunga, tenor, jenisBunga);

        const penghasilan = Number(nasabah.penghasilan ?? 0);
        const cicilanLama = nasabah.pinjaman.reduce(
            (sum, p) => sum + Number(p.cicilanBulanan ?? 0), 0,
        );

        const rasioCicilanBaru = penghasilan > 0 ? (estimasiCicilan / penghasilan) * 100 : 999;
        const rasioTotalCicilan = penghasilan > 0
            ? ((cicilanLama + estimasiCicilan) / penghasilan) * 100
            : 999;

        const alasan: string[] = [];
        let statusKelayakan: 'layak' | 'berisiko' | 'ditolak' = 'layak';
        let rekomendasiAwal: 'approve' | 'review' | 'reject' = 'approve';

        // Evaluasi rasio
        if (rasioTotalCicilan > 70) {
            alasan.push(`Total rasio cicilan ${rasioTotalCicilan.toFixed(1)}% melebihi batas aman 70%`);
            statusKelayakan = 'ditolak';
            rekomendasiAwal = 'reject';
        } else if (rasioTotalCicilan > 50) {
            alasan.push(`Total rasio cicilan ${rasioTotalCicilan.toFixed(1)}% di atas 50% — perlu review`);
            statusKelayakan = 'berisiko';
            rekomendasiAwal = 'review';
        } else {
            alasan.push(`Total rasio cicilan ${rasioTotalCicilan.toFixed(1)}% dalam batas aman (≤50%)`);
        }

        // Evaluasi riwayat
        if (nasabah.riwayatPembayaran === 'telat') {
            alasan.push('Riwayat pembayaran pernah terlambat');
            if (rekomendasiAwal === 'approve') rekomendasiAwal = 'review';
        }

        // Jumlah pinjaman aktif
        if (nasabah.pinjaman.length >= 3) {
            alasan.push(`Nasabah memiliki ${nasabah.pinjaman.length} pinjaman aktif`);
            if (rekomendasiAwal === 'approve') rekomendasiAwal = 'review';
        }

        if (alasan.length === 1 && statusKelayakan === 'layak') {
            alasan.push('Semua parameter dalam batas aman');
        }

        return {
            nasabahId,
            nama: nasabah.nama,
            pekerjaan: nasabah.pekerjaan,
            penghasilan,
            jumlahPinjaman,
            tenor,
            sukuBunga,
            jenisBunga,
            estimasiCicilanBulanan: Math.round(estimasiCicilan),
            cicilanSaatIni: Math.round(cicilanLama),
            rasioCicilanBaru: Math.round(rasioCicilanBaru * 100) / 100,
            rasioTotalCicilan: Math.round(rasioTotalCicilan * 100) / 100,
            statusKelayakan,
            alasan,
            rekomendasiAwal,
        };
    }

    private getDefaultBunga(jumlah: number): number {
        if (jumlah >= 100_000_000) return 2;
        if (jumlah >= 50_000_000) return 1.5;
        if (jumlah >= 20_000_000) return 1;
        if (jumlah >= 5_000_000) return 0.5;
        return 0;
    }

    private hitungCicilan(
        jumlah: number,
        bunga: number,
        tenor: number,
        jenis: 'flat' | 'efektif',
    ): number {
        if (jenis === 'flat') {
            const totalBunga = (jumlah * bunga * tenor) / 100;
            return (jumlah + totalBunga) / tenor;
        }
        if (bunga === 0) return jumlah / tenor;
        const r = bunga / 100 / 12;
        return (jumlah * r * Math.pow(1 + r, tenor)) / (Math.pow(1 + r, tenor) - 1);
    }

    // ─────────────────────────────────────────────────────────────
    // RISK SCORING ENGINE (MULTI-FAKTOR)
    // ─────────────────────────────────────────────────────────────

    async calculateRiskScore(nasabahId: number) {
        // 1. Ambil semua data nasabah
        const nasabah = await this.prisma.nasabah.findUnique({
            where: { id: nasabahId },
            select: {
                id: true,
                nama: true,
                pekerjaan: true,
                penghasilan: true,
                pinjaman: {
                    select: {
                        id: true,
                        status: true,
                        cicilanBulanan: true,
                        tanggalPengajuan: true,
                        pembayaran: { select: { statusBayar: true } },
                    },
                },
                peminjamanEksternal: {
                    select: { jumlahPinjaman: true, kolektibilitas: true, sumberPinjaman: true },
                },
            },
        });

        if (!nasabah) throw new NotFoundException(`Nasabah ID ${nasabahId} tidak ditemukan`);

        const penghasilan = Number(nasabah.penghasilan ?? 0);

        // 2. Hitung cicilan aktif & rasio
        const pinjamanAktif = nasabah.pinjaman.filter((p) => p.status === 'active');
        const totalCicilan = pinjamanAktif.reduce(
            (sum, p) => sum + Number(p.cicilanBulanan ?? 0), 0,
        );
        const rasio = penghasilan > 0 ? (totalCicilan / penghasilan) * 100 : 100;

        // 3. Riwayat pembayaran
        const semuaPembayaran = nasabah.pinjaman.flatMap((p) => p.pembayaran);
        const totalBayar = semuaPembayaran.length;
        const telatBayar = semuaPembayaran.filter((p) => p.statusBayar === 'telat').length;
        const persentaseTelat = totalBayar > 0 ? (telatBayar / totalBayar) * 100 : 0;

        // 4. BI Checking / SLIK
        const pernahMacet = nasabah.peminjamanEksternal.some(
            (e) => this.parseKolektibilitas(e.kolektibilitas).bermasalah,
        );
        const jumlahEksternal = nasabah.peminjamanEksternal.length;

        // 5. Behavior: frekuensi pinjaman total
        const frekuensiPinjaman = nasabah.pinjaman.length;
        const jumlahPinjamanAktif = pinjamanAktif.length;

        // 6. Hitung skor per komponen
        const skorPekerjaan = this.getSkorPekerjaan(nasabah.pekerjaan);
        const skorRasioCicilan = this.getSkorRasioCicilan(rasio);
        const skorRiwayat = this.getSkorRiwayat(totalBayar, telatBayar);
        const skorSLIK = this.getSkorPinjamanEksternal(jumlahEksternal, pernahMacet);
        const skorBehavior = this.getSkorBehavior(frekuensiPinjaman, jumlahPinjamanAktif, persentaseTelat);

        const totalSkor = skorPekerjaan + skorRasioCicilan + skorRiwayat + skorSLIK + skorBehavior;
        const kategoriRisiko = this.getKategori(totalSkor);
        const rekomendasi = this.getRekomendasi(totalSkor);
        const indikasi = this.detectBehaviorFlags(
            frekuensiPinjaman,
            jumlahPinjamanAktif,
            persentaseTelat,
            pernahMacet,
        );

        // 7. Simpan / update RisikoNasabah di DB
        const risikoData = {
            skorRisiko: totalSkor,
            kategoriRisiko,
            rekomendasi,
            rasioSiklusPersentase: Math.round(rasio * 100) / 100,
            persentaseKeterlambatan: Math.round(persentaseTelat * 100) / 100,
            frekuensiPinjaman,
            penjumlahPeminjamanAktif: jumlahPinjamanAktif,
            indikasiBehaviorBerisiko: indikasi,
        };

        await this.prisma.risikoNasabah.upsert({
            where: { nasabahId },
            update: risikoData,
            create: { nasabahId, ...risikoData },
        });

        return {
            nasabahId,
            nama: nasabah.nama,
            pekerjaan: nasabah.pekerjaan,
            penghasilan,
            cicilanBulanan: Math.round(totalCicilan),
            rasioCicilan: Math.round(rasio * 100) / 100,
            skorRisiko: totalSkor,
            kategoriRisiko,
            rekomendasi,
            indikasiBehaviorBerisiko: indikasi,
            detailSkor: {
                skorPekerjaan,
                skorRasioCicilan,
                skorRiwayatPembayaran: skorRiwayat,
                skorPinjamanEksternal: skorSLIK,
                skorBehavior,
                totalSkor,
            },
            infoTambahan: {
                totalPembayaran: totalBayar,
                jumlahTelat: telatBayar,
                persentaseTelat: Math.round(persentaseTelat * 100) / 100,
                frekuensiPinjaman,
                pinjamanAktif: jumlahPinjamanAktif,
                pinjamanEksternalAktif: jumlahEksternal,
                pernahMacetSLIK: pernahMacet,
            },
        };
    }

    // ─────────────────────────────────────────────────────────────
    // GET RISK PROFILE (ambil dari DB)
    // ─────────────────────────────────────────────────────────────

    async getRisikoNasabah(nasabahId: number) {
        const risiko = await this.prisma.risikoNasabah.findUnique({
            where: { nasabahId },
            include: {
                nasabah: { select: { nama: true, pekerjaan: true, penghasilan: true, nik: true } },
            },
        });
        if (!risiko) {
            // Hitung dulu kalau belum ada
            return this.calculateRiskScore(nasabahId);
        }
        return risiko;
    }

    // ─────────────────────────────────────────────────────────────
    // LAPORAN SEMUA NASABAH
    // ─────────────────────────────────────────────────────────────

    async getLaporanRisikoSemua() {
        const semua = await this.prisma.risikoNasabah.findMany({
            include: {
                nasabah: {
                    select: {
                        nama: true,
                        nik: true,
                        pekerjaan: true,
                        penghasilan: true,
                        pinjaman: {
                            select: { status: true, jumlahPinjaman: true, cicilanBulanan: true },
                        },
                    },
                },
            },
            orderBy: { skorRisiko: 'desc' },
        });

        const ringkasan = {
            totalNasabah: semua.length,
            approve: semua.filter((r) => r.rekomendasi === 'approve').length,
            review: semua.filter((r) => r.rekomendasi === 'review').length,
            reject: semua.filter((r) => r.rekomendasi === 'reject').length,
            risikoRendah: semua.filter((r) => r.kategoriRisiko === 'rendah').length,
            risikoSedang: semua.filter((r) => r.kategoriRisiko === 'sedang').length,
            risikoTinggi: semua.filter((r) => r.kategoriRisiko === 'tinggi').length,
        };

        return { ringkasan, data: semua };
    }

    // ─────────────────────────────────────────────────────────────
    // DECISION SUPPORT: ambil rekomendasi akhir
    // ─────────────────────────────────────────────────────────────

    async getKeputusan(nasabahId: number) {
        // Selalu recalculate supaya data up-to-date
        const hasil = await this.calculateRiskScore(nasabahId);

        const penjelasan: string[] = [];
        const skor = hasil.skorRisiko;

        if (skor < 35) {
            penjelasan.push('Skor risiko rendah — nasabah layak mendapatkan pinjaman');
            penjelasan.push('Semua faktor dalam batas aman');
        } else if (skor < 60) {
            penjelasan.push('Skor risiko sedang — diperlukan review manual oleh analis kredit');
            if (hasil.detailSkor.skorRasioCicilan >= 20)
                penjelasan.push('Rasio cicilan mendekati batas maksimal');
            if (hasil.detailSkor.skorRiwayatPembayaran >= 15)
                penjelasan.push('Terdapat riwayat keterlambatan pembayaran');
            if (hasil.detailSkor.skorPinjamanEksternal >= 5)
                penjelasan.push('Ditemukan pinjaman eksternal dengan kolektibilitas bermasalah');
        } else {
            penjelasan.push('Skor risiko tinggi — pengajuan pinjaman tidak direkomendasikan');
            if (hasil.detailSkor.skorRasioCicilan >= 25)
                penjelasan.push('Rasio cicilan terlalu tinggi terhadap penghasilan');
            if (hasil.detailSkor.skorPekerjaan >= 18)
                penjelasan.push('Jenis pekerjaan memiliki risiko instabilitas pendapatan tinggi');
            if (hasil.indikasiBehaviorBerisiko)
                penjelasan.push(`Perilaku berisiko: ${hasil.indikasiBehaviorBerisiko}`);
        }

        return {
            nasabahId,
            nama: hasil.nama,
            skorRisiko: skor,
            kategoriRisiko: hasil.kategoriRisiko,
            rekomendasi: hasil.rekomendasi,
            penjelasan,
            detailSkor: hasil.detailSkor,
            indikasiBehaviorBerisiko: hasil.indikasiBehaviorBerisiko,
            timestamp: new Date().toISOString(),
        };
    }
}
