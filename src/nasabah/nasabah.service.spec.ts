import { BadRequestException } from '@nestjs/common';
import { NasabahService } from './nasabah.service';

describe('NasabahService', () => {
  let service: NasabahService;
  let prisma: {
    nasabah: { create: jest.Mock; update: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; count: jest.Mock; delete: jest.Mock };
    analisisRisikoPekerjaan: { findFirst: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      nasabah: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
      analisisRisikoPekerjaan: {
        findFirst: jest.fn(),
      },
    };

    service = new NasabahService(prisma as any);
  });

  it('should attach risk data when the job exists in the master table', async () => {
    prisma.analisisRisikoPekerjaan.findFirst.mockResolvedValue({
      id: 7,
      pekerjaan: 'PNS',
      skorRisiko: 10,
      kategoriRisiko: 'Sangat Rendah',
    });
    prisma.nasabah.create.mockResolvedValue({ id: 1 });

    await service.create({
      nama: 'Budi',
      nik: '3201010101010001',
      pekerjaan: 'PNS',
      penghasilan: 5000000,
    } as any);

    expect(prisma.analisisRisikoPekerjaan.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          pekerjaan: {
            equals: 'PNS',
            mode: 'insensitive',
          },
        },
      }),
    );

    expect(prisma.nasabah.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pekerjaan: 'PNS',
          skorRisikoPekerjaan: 10,
          kategoriRisikoPekerjaan: 'Sangat Rendah',
          analisisRisikoPekerjaanId: 7,
        }),
      }),
    );
  });

  it('should keep the risk fields empty when the job has no risk analysis data', async () => {
    prisma.analisisRisikoPekerjaan.findFirst.mockResolvedValue(null);
    prisma.nasabah.create.mockResolvedValue({ id: 2 });

    await service.create({
      nama: 'Budi',
      nik: '3201010101010002',
      pekerjaan: 'Baru',
      penghasilan: 5000000,
    } as any);

    expect(prisma.nasabah.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          skorRisikoPekerjaan: null,
          kategoriRisikoPekerjaan: null,
          analisisRisikoPekerjaanId: null,
        }),
      }),
    );
  });
});
