import { PinjamanService } from './pinjaman.service';

describe('PinjamanService', () => {
    it('should create a loan from frontend payload by creating or reusing a nasabah', async () => {
        const prisma = {
            nasabah: {
                findUnique: jest.fn().mockResolvedValue(null),
                create: jest.fn().mockResolvedValue({ id: 10, nama: 'Test User', nik: '1234567890123456' }),
            },
            pinjaman: {
                create: jest.fn().mockResolvedValue({ id: 1, nasabahId: 10, jumlahPinjaman: 10000000 }),
            },
            risikoNasabah: {
                create: jest.fn().mockResolvedValue({ id: 1 }),
            },
        };

        const service = new PinjamanService(prisma as any);

        const result = await service.create({
            nama: 'Test User',
            nik: '1234567890123456',
            email: 'test@test.com',
            penghasilan: 5000000,
            cicilan: 1000000,
            jumlah: 10000000,
            tenor: '12',
            bunga: '5',
            risiko: 'Rendah',
            rekomendasi: 'Approve',
            tujuan: 'Modal usaha',
        } as any);

        expect(prisma.nasabah.create).toHaveBeenCalled();
        expect(prisma.pinjaman.create).toHaveBeenCalled();
        expect(result).toMatchObject({
            id: 1,
            nasabahId: 10,
            jumlahPinjaman: 10000000,
            nama: 'Test User',
            nik: '1234567890123456',
        });
    });
});
