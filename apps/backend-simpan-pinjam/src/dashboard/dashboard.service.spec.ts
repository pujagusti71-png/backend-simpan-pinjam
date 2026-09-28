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
});