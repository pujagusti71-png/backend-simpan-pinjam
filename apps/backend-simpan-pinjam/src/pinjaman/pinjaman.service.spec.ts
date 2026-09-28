import { NasabahService } from '../nasabah/nasabah.service';
import { PinjamanService } from './pinjaman.service';

describe('PinjamanService', () => {
    it('should create a loan from frontend payload by creating or reusing a nasabah', async () => {
        const prisma = {
            nasabah: {
                findUnique: jest.fn().mockResolvedValue(null),
                create: jest.fn().mockResolvedValue({ id: 10, nama: 'Test User', nik: '3204120101900004', alamat: 'Jl. Uji', pekerjaan: 'Wiraswasta' }),
            },
            analisisRisikoPekerjaan: {
                findFirst: jest.fn().mockResolvedValue({ pekerjaan: 'Wiraswasta', kategoriRisiko: 'Rendah' }),
            },
            pinjaman: {
                create: jest.fn().mockResolvedValue({ id: 1, nasabahId: 10, jumlahPinjaman: 10000000 }),
            },
            analisisRisiko: { recomputeForNasabah: jest.fn().mockResolvedValue(undefined) },
        };

        const service = new PinjamanService(prisma as any, prisma.analisisRisiko as any);

        const result = await service.create({
            nama: 'Test User',
            nik: '3204120101900004',
            alamat: 'Jl. Uji',
            pekerjaan: 'Wiraswasta',
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
            nik: '3204120101900004',
        });
    });

    it('should create a loan for an existing member using only the member id and loan details', async () => {
        const prisma = {
            nasabah: {
                findUnique: jest.fn().mockResolvedValue({
                    id: 11,
                    nama: 'Anggota Terdaftar',
                    nik: '3204120101900004',
                    tanggalLahir: new Date('1990-01-01'),
                    alamat: 'Jl. Uji',
                    pekerjaan: 'PNS',
                    penghasilan: 5000000,
                }),
                update: jest.fn(),
            },
            analisisRisikoPekerjaan: {
                findFirst: jest.fn().mockResolvedValue({ pekerjaan: 'PNS', kategoriRisiko: 'Rendah' }),
            },
            pinjaman: {
                create: jest.fn().mockResolvedValue({ id: 2, nasabahId: 11, jumlahPinjaman: 1000000 }),
            },
            analisisRisiko: { recomputeForNasabah: jest.fn().mockResolvedValue(undefined) },
        };
        const service = new PinjamanService(prisma as any, prisma.analisisRisiko as any);

        await service.create({ nasabahId: 11, jumlahPinjaman: 1000000, tenor: 12 } as any);

        expect(prisma.pinjaman.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ nasabahId: 11, jumlahPinjaman: 1000000 }),
        }));
        expect(prisma.nasabah.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 11 },
            data: expect.objectContaining({ nama: 'Anggota Terdaftar', pekerjaan: 'PNS' }),
        }));
    });

    it('should create a nasabah with the fields used by the frontend', async () => {
        const prisma = {
            nasabah: {
                findUnique: jest.fn().mockResolvedValue(null),
                create: jest.fn().mockResolvedValue({ id: 11, nama: 'Uji Nasabah', nik: '1234567890123456' }),
            },
        };

        const service = new NasabahService(prisma as any);

        await service.create({
            nama: 'Uji Nasabah',
            nik: '3204120101900004',
            noRek: '123456',
            hp: '081234567890',
            email: 'uji@example.com',
            lahir: '2000-01-01',
            alamat: 'Jl. Uji',
            ibu: { nama: 'Ibu Uji', lahir: '1970-01-01', alamat: 'Jl. Ibu' },
            kerja: 'PNS',
            gaji: 5000000,
            cicilan: 1000000,
            riwayat: 'Lancar',
            slik: 'K1',
            hutangLain: 0,
            lembaga: 0,
            tunggakan: false,
            catatan: 'test',
        } as any);

        expect(prisma.nasabah.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    nama: 'Uji Nasabah',
                    nik: '3204120101900004',
                }),
            }),
        );
    });
});
