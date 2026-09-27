import { PembayaranService } from './pembayaran.service';

describe('PembayaranService', () => {
  it('should auto-calculate next installment and record payment details', async () => {
    const existingPayments = [
      {
        id: 1,
        pinjamanId: 1,
        nomorCicilan: 1,
        jumlahPokok: 833333,
        jumlahBunga: 22741,
        jumlahBayar: 856074,
        tanggalPembayaran: new Date('2026-09-02T00:00:00.000Z'),
      },
    ];

    const prisma = {
      pinjaman: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          nasabahId: 10,
          jumlahPinjaman: 10000000,
          tenor: 12,
          sukuBunga: 5,
          totalBunga: 272898,
          totalPembayaran: 10272898,
          status: 'active',
          pembayaran: existingPayments,
        }),
        update: jest.fn().mockResolvedValue({ id: 1, status: 'active' }),
      },
      pembayaran: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue(existingPayments),
        create: jest.fn().mockResolvedValue({
          id: 2,
          pinjamanId: 1,
          nomorCicilan: 2,
          jumlahPokok: 833333,
          jumlahBunga: 22741,
          jumlahBayar: 856074,
        }),
      },
    };

    const service = new PembayaranService(prisma as any);

    const result = await service.create({
      pinjamanId: 1,
      tanggalPembayaran: '2026-09-03T00:00:00.000Z',
      jumlahBayar: 856074,
    } as any);

    expect(prisma.pembayaran.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pinjamanId: 1,
          nomorCicilan: 2,
          jumlahPokok: 833333,
          jumlahBunga: 22741,
          jumlahBayar: 856074,
        }),
      }),
    );
    expect(result).toMatchObject({
      id: 2,
      nomorCicilan: 2,
      jumlahBayar: 856074,
    });
  });

  it('should reject payment when loan is already fully paid', async () => {
    const prisma = {
      pinjaman: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          nasabahId: 10,
          jumlahPinjaman: 10000000,
          tenor: 12,
          totalBunga: 272898,
          totalPembayaran: 10272898,
          status: 'lunas',
          pembayaran: Array.from({ length: 12 }, (_, index) => ({
            id: index + 1,
            jumlahBayar: 856074,
            nomorCicilan: index + 1,
            jumlahPokok: 833333,
            jumlahBunga: 22741,
          })),
        }),
      },
      pembayaran: {
        findMany: jest.fn().mockResolvedValue(Array.from({ length: 12 }, (_, index) => ({
          id: index + 1,
          jumlahBayar: 856074,
          nomorCicilan: index + 1,
          jumlahPokok: 833333,
          jumlahBunga: 22741,
        }))),
      },
    };

    const service = new PembayaranService(prisma as any);

    await expect(service.create({ pinjamanId: 1, jumlahBayar: 100000 } as any)).rejects.toThrow('pinjaman sudah lunas');
  });
});
