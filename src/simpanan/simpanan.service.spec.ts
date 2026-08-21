import { SimpananService } from './simpanan.service';

describe('SimpananService', () => {
    it('should return all savings records', async () => {
        const mockData = [
            {
                id: 1,
                nasabahId: 1,
                jumlahSetoran: 100000,
                tanggalSetoran: new Date('2026-01-01T00:00:00.000Z'),
                saldoAkhir: 100000,
                status: 'aktif',
                keterangan: 'Setoran awal',
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-01T00:00:00.000Z'),
                bungaSimpanan: 0,
                jenisInterest: 'efektif',
            },
        ];

        const prisma = {
            simpanan: {
                findMany: jest.fn().mockResolvedValue(mockData),
            },
        };

        const service = new SimpananService(prisma as any);

        await expect(service.findAll()).resolves.toEqual(mockData);
        expect(prisma.simpanan.findMany).toHaveBeenCalled();
    });
});
