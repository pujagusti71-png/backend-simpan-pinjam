import { SimpananService } from './simpanan.service';

describe('SimpananService', () => {
    it('should return all savings records when listing the savings dataset', async () => {
        const mockRecords = [
            {
                id: 1,
                nasabahId: 1,
                jumlahSetoran: 500000,
                bungaSimpanan: 2.5,
                jenisInterest: 'flat',
                tanggalSetoran: new Date('2026-07-01T00:00:00.000Z'),
                saldoAkhir: 500000,
                status: 'aktif',
                keterangan: 'Setoran awal',
                createdAt: new Date('2026-07-01T00:00:00.000Z'),
                updatedAt: new Date('2026-07-01T00:00:00.000Z'),
            },
        ];

        const prisma = {
            simpanan: {
                findMany: jest.fn().mockResolvedValue(mockRecords),
            },
        };

        const service = new SimpananService(prisma as any);

        await expect(service.findAll()).resolves.toEqual(mockRecords);
        expect(prisma.simpanan.findMany).toHaveBeenCalledWith({
            orderBy: { createdAt: 'desc' },
        });
    });

    it('should apply a 0.5% automatic interest for balances above 5 million and up to 20 million', async () => {
        const prisma = {
            nasabah: {
                findUnique: jest.fn().mockResolvedValue({ id: 1, nama: 'A', nik: '1', pekerjaan: 'PNS', penghasilan: 0, saldoRataRata: 0, estimasiPengeluaran: 0, createdAt: new Date(), updatedAt: new Date() }),
            },
            simpanan: {
                findMany: jest.fn().mockResolvedValue([]),
                create: jest.fn().mockResolvedValue({ id: 10, nasabahId: 1, jumlahSetoran: 10000000, saldoAkhir: 10050000, status: 'aktif', keterangan: 'Setoran awal' }),
            },
            transaksiBunga: {
                create: jest.fn().mockResolvedValue({ id: 99, simpananId: 10, nominalBunga: 50000, tanggalTransaksi: new Date() }),
            },
        };

        const service = new SimpananService(prisma as any);

        await service.create({
            nasabahId: 1,
            jumlahSetoran: 10000000,
            jenisInterest: 'flat',
            tanggalSetoran: new Date('2026-08-19T00:00:00.000Z'),
            keterangan: 'Setoran awal',
        });

        expect(prisma.transaksiBunga.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    simpananId: 10,
                    nominalBunga: 50000,
                }),
            }),
        );
    });

    it('should create a savings account for a new member submitted by the frontend', async () => {
        const member = { id: 12, nama: 'Uji Simpanan', nik: '3204120101900004', pekerjaan: 'Wiraswasta', penghasilan: 5000000 };
        const prisma = {
            nasabah: {
                findUnique: jest.fn()
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(member),
                create: jest.fn().mockResolvedValue(member),
            },
            simpanan: {
                findMany: jest.fn().mockResolvedValue([]),
                create: jest.fn().mockResolvedValue({ id: 13, nasabahId: 12, jumlahSetoran: 500000, saldoAkhir: 500000 }),
            },
        };

        const service = new SimpananService(prisma as any);
        await service.create({
            nama: member.nama,
            nik: member.nik,
            alamat: 'Jl. Uji',
            pekerjaan: member.pekerjaan,
            penghasilan: member.penghasilan,
            jumlahSetoran: 500000,
        } as any);

        expect(prisma.nasabah.create).toHaveBeenCalled();
        expect(prisma.simpanan.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ nasabahId: 12, jumlahSetoran: 500000 }),
        }));
    });
});
