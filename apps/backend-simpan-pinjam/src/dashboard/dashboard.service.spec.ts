import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
    it('sums each member latest savings balance instead of historical snapshots', async () => {
        const prisma = {
            nasabah: { count: jest.fn().mockResolvedValue(2) },
            pinjaman: {
                count: jest.fn().mockResolvedValue(0),
                aggregate: jest.fn().mockResolvedValue({ _sum: { jumlahPinjaman: null } }),
            },
            simpanan: {
                findMany: jest.fn().mockResolvedValue([
                    { nasabahId: 1, saldoAkhir: 750000 },
                    { nasabahId: 1, saldoAkhir: 500000 },
                    { nasabahId: 2, saldoAkhir: 500000 },
                ]),
            },
            pembayaran: { findMany: jest.fn().mockResolvedValue([]) },
            risikoNasabah: { groupBy: jest.fn().mockResolvedValue([]) },
        };
        const service = new DashboardService(prisma as any);

        const summary = await service.getDashboardSummary();

        expect(summary.simpanan.totalSaldo).toBe(1250000);
        expect(prisma.simpanan.findMany).toHaveBeenCalledWith({
            select: { nasabahId: true, saldoAkhir: true },
            orderBy: { createdAt: 'desc' },
        });
    });

    it('returns 6 dynamic month buckets for delinquency trend with real 0 values when no late payments exist', async () => {
        const prisma = {
            pembayaran: { findMany: jest.fn().mockResolvedValue([]) },
        };
        const service = new DashboardService(prisma as any);

        const trend = await service.getDelinquencyTrend();

        expect(trend).toHaveLength(6);
        trend.forEach((bucket) => {
            expect(typeof bucket.month).toBe('string');
            expect(bucket.value).toBe(0);
        });
    });

    it('returns comprehensive report structure with total, ringkasanRisiko, and real nasabah records', async () => {
        const prisma = {
            nasabah: {
                findMany: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        nama: 'Nasabah Satu',
                        nik: '3171012345670001',
                        pekerjaan: 'Wiraswasta',
                        penghasilan: 5000000,
                        pinjaman: [],
                        risikoNasabah: null,
                    },
                ]),
            },
        };
        const service = new DashboardService(prisma as any);

        const laporan = await service.getLaporan();

        expect(laporan.ringkasan.totalNasabah).toBe(1);
        expect(laporan.data).toHaveLength(1);
        expect(laporan.data[0].nama).toBe('Nasabah Satu');
        expect(laporan.data[0].kategoriRisiko).toBe('Belum dihitung');
    });
});