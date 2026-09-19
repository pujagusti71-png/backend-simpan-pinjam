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
            analisisRisikoPekerjaan: {
                findFirst: jest.fn().mockResolvedValue({
                    pekerjaan: 'PNS',
                    skorRisiko: 10,
                    kategoriRisiko: 'Sangat Rendah',
                }),
            },
        };

        const service = new PinjamanService(prisma as any);

        const result = await service.create({
            nama: 'Test User',
            nik: '1234567890123456',
            alamat: 'Jakarta Selatan',
            tanggalLahir: '1995-06-15',
            email: 'test@test.com',
            penghasilan: 5000000,
            cicilan: 1000000,
            jumlah: 10000000,
            tenor: '12',
            bunga: '5',
            risiko: 'Rendah',
            rekomendasi: 'Approve',
            tujuan: 'Modal usaha',
            pekerjaan: 'PNS',
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

    it('should auto-seed missing risk analysis for TNI/POLRI before creating a loan', async () => {
        const prisma = {
            analisisRisikoPekerjaan: {
                findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({
                    pekerjaan: 'TNI/POLRI',
                    skorRisiko: 15,
                    kategoriRisiko: 'Sangat Rendah',
                }),
                upsert: jest.fn().mockResolvedValue({
                    pekerjaan: 'TNI/POLRI',
                    skorRisiko: 15,
                    kategoriRisiko: 'Sangat Rendah',
                }),
            },
            nasabah: {
                findUnique: jest.fn().mockResolvedValue(null),
                create: jest.fn().mockResolvedValue({ id: 21, nama: 'TNI', nik: '9900112233445566' }),
            },
            pinjaman: {
                create: jest.fn().mockResolvedValue({ id: 99, nasabahId: 21, jumlahPinjaman: 2500000 }),
            },
            risikoNasabah: {
                create: jest.fn().mockResolvedValue({ id: 2 }),
            },
        };

        const service = new PinjamanService(prisma as any);

        const result = await service.create({
            nama: 'TNI',
            nik: '9900112233445566',
            email: 'tni@test.com',
            alamat: 'Jakarta',
            tanggalLahir: '1990-01-01',
            penghasilan: 6000000,
            cicilan: 400000,
            jumlah: 2500000,
            tenor: '12',
            bunga: '5',
            pekerjaan: 'TNI/POLRI',
            tujuan: 'Konsolidasi',
        } as any);

        expect(prisma.analisisRisikoPekerjaan.upsert).toHaveBeenCalled();
        expect(prisma.pinjaman.create).toHaveBeenCalled();
        expect(result).toMatchObject({
            nasabahId: 21,
            jumlahPinjaman: 2500000,
            nama: 'TNI',
        });
    });
});
