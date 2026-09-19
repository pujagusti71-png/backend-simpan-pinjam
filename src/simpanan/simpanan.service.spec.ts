import { SimpananService } from './simpanan.service';

describe('SimpananService', () => {
    it('should return all savings records with potongan alias', async () => {
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

        const result = await service.findAll();

        expect(result[0]).toMatchObject({
            bungaSimpanan: 0,
            potonganSimpanan: 0,
        });
        expect(prisma.simpanan.findMany).toHaveBeenCalled();
    });

    it('should create a new nasabah automatically when simpanan is submitted without nasabahId', async () => {
        const prisma = {
            nasabah: {
                findUnique: jest.fn()
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce({
                        id: 21,
                        nama: 'Budi',
                        nik: '3201010101010001',
                        tanggalLahir: new Date('1990-01-01'),
                        alamat: 'Bandung',
                        pekerjaan: 'TNI/POLRI',
                        penghasilan: 5000000,
                    }),
                create: jest.fn().mockResolvedValue({
                    id: 21,
                    nama: 'Budi',
                    nik: '3201010101010001',
                    tanggalLahir: new Date('1990-01-01'),
                    alamat: 'Bandung',
                    pekerjaan: 'TNI/POLRI',
                    penghasilan: 5000000,
                }),
            },
            simpanan: {
                findMany: jest.fn().mockResolvedValue([]),
                create: jest.fn().mockResolvedValue({
                    id: 7,
                    nasabahId: 21,
                    jumlahSetoran: 150000,
                    bungaSimpanan: 0,
                    jenisInterest: 'efektif',
                    tanggalSetoran: new Date('2026-01-02T00:00:00.000Z'),
                    saldoAkhir: 150000,
                    status: 'aktif',
                    keterangan: 'Setoran awal',
                }),
            },
            transaksiBunga: {
                create: jest.fn().mockResolvedValue({ id: 1 }),
            },
        };

        const service = new SimpananService(prisma as any);

        const result = await service.create({
            nama: 'Budi',
            nik: '3201010101010001',
            tanggalLahir: '1990-01-01',
            alamat: 'Bandung',
            pekerjaan: 'TNI/POLRI',
            penghasilan: 5000000,
            jumlahSetoran: 150000,
            keterangan: 'Setoran awal',
        } as any);

        expect(prisma.nasabah.create).toHaveBeenCalled();
        expect(prisma.simpanan.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    nasabahId: 21,
                    jumlahSetoran: 150000,
                    keterangan: 'Setoran awal',
                }),
            }),
        );
        expect(result).toMatchObject({
            nasabahId: 21,
            jumlahSetoran: 150000,
            status: 'aktif',
        });
    });
});
