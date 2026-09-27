import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) { }

    async getChartData() {
        const now = new Date();
        const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const [savings, loans] = await Promise.all([
            this.prisma.simpanan.findMany({
                where: { tanggalSetoran: { gte: firstMonth } },
                select: { jumlahSetoran: true, tanggalSetoran: true, keterangan: true },
            }),
            this.prisma.pinjaman.findMany({
                where: { tanggalPengajuan: { gte: firstMonth } },
                select: { jumlahPinjaman: true, tanggalPengajuan: true },
            }),
        ]);

        const months = Array.from({ length: 6 }, (_, index) => {
            const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
            return {
                key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
                bulan: new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(date),
                simpanan: 0,
                pinjaman: 0,
            };
        });
        const monthMap = new Map(months.map((month) => [month.key, month]));

        savings.forEach((item) => {
            if (item.keterangan === 'Potongan tabungan') return;
            const date = new Date(item.tanggalSetoran);
            const month = monthMap.get(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
            if (month) month.simpanan += Number(item.jumlahSetoran || 0);
        });
        loans.forEach((item) => {
            const date = new Date(item.tanggalPengajuan);
            const month = monthMap.get(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
            if (month) month.pinjaman += Number(item.jumlahPinjaman || 0);
        });

        return months.map(({ key, ...month }) => month);
    }

    /**
     * Tren keterlambatan pembayaran (%) 6 bulan terakhir
     */
    async getDelinquencyTrend() {
        const now = new Date();
        const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const pembayaran = await this.prisma.pembayaran.findMany({
            where: {
                OR: [
                    { tanggalBayar: { gte: firstMonth } },
                    { createdAt: { gte: firstMonth } },
                ],
            },
            select: { tanggalBayar: true, statusBayar: true, createdAt: true },
        });

        const months = Array.from({ length: 6 }, (_, index) => {
            const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
            return {
                key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
                month: new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' }).format(date),
                total: 0,
                telat: 0,
            };
        });
        const monthMap = new Map(months.map((month) => [month.key, month]));

        pembayaran.forEach((item) => {
            const date = new Date(item.tanggalBayar || item.createdAt);
            const bucket = monthMap.get(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
            if (!bucket) return;
            bucket.total += 1;
            if (item.statusBayar === 'telat') bucket.telat += 1;
        });

        return months.map(({ key, total, telat, month }) => ({
            month,
            value: total > 0 ? Math.round((telat / total) * 100 * 100) / 100 : 0,
        }));
    }

    /**
     * Ringkasan statistik utama dashboard monitoring
     */
    async getDashboardSummary() {
        const [
            totalNasabah,
            totalPinjamanAktif,
            totalPinjamanPending,
            totalPinjamanLunas,
            totalPinjamanRejected,
            totalSimpanan,
            pembayaranTelat,
            risikoNasabah,
        ] = await Promise.all([
            this.prisma.nasabah.count(),
            this.prisma.pinjaman.count({ where: { status: 'active' } }),
            this.prisma.pinjaman.count({ where: { status: 'pending' } }),
            this.prisma.pinjaman.count({ where: { status: 'lunas' } }),
            this.prisma.pinjaman.count({ where: { status: 'rejected' } }),
            this.prisma.simpanan.aggregate({ _sum: { saldoAkhir: true } }),
            // Nasabah dengan minimal 1 pembayaran telat di pinjaman aktif
            this.prisma.pembayaran.findMany({
                where: { statusBayar: 'telat' },
                select: { pinjaman: { select: { nasabahId: true } } },
                distinct: ['pinjamanId'],
            }),
            // Breakdown kategori risiko
            this.prisma.risikoNasabah.groupBy({
                by: ['kategoriRisiko'],
                _count: { id: true },
            }),
        ]);

        // Hitung nasabah unik yang telat
        const nasabahTelatIds = new Set(pembayaranTelat.map((p) => p.pinjaman.nasabahId));

        // Total nilai pinjaman aktif
        const nilaiPinjamanAktif = await this.prisma.pinjaman.aggregate({
            _sum: { jumlahPinjaman: true },
            where: { status: 'active' },
        });

        // Breakdown risiko
        const risikoMap: Record<string, number> = { rendah: 0, sedang: 0, tinggi: 0 };
        risikoNasabah.forEach((r) => {
            const kategori = (r.kategoriRisiko || '').toLowerCase();
            if (risikoMap[kategori] !== undefined) risikoMap[kategori] = r._count.id;
        });

        // Rekomendasi breakdown
        const rekomendasiBreakdown = await this.prisma.risikoNasabah.groupBy({
            by: ['rekomendasi'],
            _count: { id: true },
        });
        const rekMap: Record<string, number> = { approve: 0, review: 0, reject: 0 };
        rekomendasiBreakdown.forEach((r) => {
            const rek = (r.rekomendasi || '').toLowerCase();
            if (rekMap[rek] !== undefined) rekMap[rek] = r._count.id;
        });

        return {
            nasabah: {
                total: totalNasabah,
                denganKeterlambatan: nasabahTelatIds.size,
                risikoRendah: risikoMap['rendah'],
                risikoSedang: risikoMap['sedang'],
                risikoTinggi: risikoMap['tinggi'],
            },
            pinjaman: {
                aktif: totalPinjamanAktif,
                pending: totalPinjamanPending,
                lunas: totalPinjamanLunas,
                rejected: totalPinjamanRejected,
                nilaiTotalAktif: Number(nilaiPinjamanAktif._sum.jumlahPinjaman ?? 0),
            },
            simpanan: {
                totalSaldo: Number(totalSimpanan._sum.saldoAkhir ?? 0),
            },
            keputusan: {
                approve: rekMap['approve'],
                review: rekMap['review'],
                reject: rekMap['reject'],
            },
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Laporan analisis lengkap per nasabah
     */
    async getLaporan() {
        const nasabahList = await this.prisma.nasabah.findMany({
            select: {
                id: true,
                nama: true,
                nik: true,
                pekerjaan: true,
                penghasilan: true,
                pinjaman: {
                    select: {
                        id: true,
                        jumlahPinjaman: true,
                        tenor: true,
                        cicilanBulanan: true,
                        status: true,
                        tanggalPengajuan: true,
                        pembayaran: {
                            select: { statusBayar: true, jumlahBayar: true, tanggalBayar: true },
                        },
                    },
                },
                risikoNasabah: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const laporan = nasabahList.map((nasabah) => {
            const semuaPembayaran = nasabah.pinjaman.flatMap((p) => p.pembayaran);
            const totalBayar = semuaPembayaran.length;
            const telatBayar = semuaPembayaran.filter((p) => p.statusBayar === 'telat').length;
            const persentaseTelat =
                totalBayar > 0 ? Math.round((telatBayar / totalBayar) * 100 * 100) / 100 : 0;

            const pinjamanAktif = nasabah.pinjaman.filter((p) => p.status === 'active');
            const totalCicilan = pinjamanAktif.reduce(
                (sum, p) => sum + Number(p.cicilanBulanan ?? 0), 0,
            );
            const penghasilan = Number(nasabah.penghasilan ?? 0);
            const rasio = penghasilan > 0 ? Math.round((totalCicilan / penghasilan) * 100 * 100) / 100 : 0;

            return {
                nasabahId: nasabah.id,
                nama: nasabah.nama,
                nik: nasabah.nik,
                pekerjaan: nasabah.pekerjaan,
                penghasilan,
                totalPinjaman: nasabah.pinjaman.length,
                pinjamanAktif: pinjamanAktif.length,
                totalCicilanBulanan: Math.round(totalCicilan),
                rasioGajiCicilan: rasio,
                totalPembayaran: totalBayar,
                jumlahTelat: telatBayar,
                persentaseTelat,
                riwayatPembayaran: persentaseTelat === 0 ? 'Lancar' : persentaseTelat > 30 ? 'Sering Terlambat' : 'Pernah Terlambat',
                skorRisiko: nasabah.risikoNasabah?.skorRisiko ?? null,
                kategoriRisiko: nasabah.risikoNasabah?.kategoriRisiko ?? 'Belum dihitung',
                rekomendasi: nasabah.risikoNasabah?.rekomendasi ?? 'Belum dihitung',
                indikasiBehavior: nasabah.risikoNasabah?.indikasiBehaviorBerisiko ?? null,
            };
        });

        // Ringkasan laporan
        const ringkasan = {
            totalNasabah: laporan.length,
            nasabahLancar: laporan.filter((n) => n.persentaseTelat === 0).length,
            nasabahPernaTerlambat: laporan.filter(
                (n) => n.persentaseTelat > 0 && n.persentaseTelat <= 30,
            ).length,
            nasabahSeringTerlambat: laporan.filter((n) => n.persentaseTelat > 30).length,
            approve: laporan.filter((n) => n.rekomendasi === 'approve').length,
            review: laporan.filter((n) => n.rekomendasi === 'review').length,
            reject: laporan.filter((n) => n.rekomendasi === 'reject').length,
        };

        return {
            ringkasan,
            data: laporan,
            generatedAt: new Date().toISOString(),
        };
    }
}