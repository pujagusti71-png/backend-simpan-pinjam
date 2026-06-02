import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePembayaranDto } from './dto/create-pembayaran.dto';

@Injectable()
export class PembayaranService {
    constructor(private prisma: PrismaService) { }

    async create(createPembayaranDto: CreatePembayaranDto) {
        const data = { ...createPembayaranDto } as any;

        if (createPembayaranDto.dariTanggalSeharusnya) {
            const parsedDate = new Date(createPembayaranDto.dariTanggalSeharusnya);
            if (Number.isNaN(parsedDate.getTime())) {
                throw new BadRequestException('dariTanggalSeharusnya tidak valid. Gunakan format ISO 8601.');
            }
            data.dariTanggalSeharusnya = parsedDate;
        }

        return await this.prisma.pembayaran.create({
            data,
        });
    }

    async findAll() {
        return await this.prisma.pembayaran.findMany({
            include: {
                pinjaman: {
                    include: {
                        nasabah: true,
                    },
                },
            },
        });
    }

    async findOne(id: number) {
        return await this.prisma.pembayaran.findUnique({
            where: { id },
            include: {
                pinjaman: true,
            },
        });
    }

    async findByPinjaman(pinjamanId: number) {
        return await this.prisma.pembayaran.findMany({
            where: { pinjamanId },
        });
    }

    async findByNasabah(nasabahId: number) {
        return await this.prisma.pembayaran.findMany({
            where: {
                pinjaman: {
                    nasabahId,
                },
            },
            include: {
                pinjaman: true,
            },
        });
    }

    async countLatePayments(nasabahId: number) {
        return await this.prisma.pembayaran.count({
            where: {
                statusBayar: 'telat',
                pinjaman: {
                    nasabahId,
                },
            },
        });
    }

    async countOnTimePayments(nasabahId: number) {
        return await this.prisma.pembayaran.count({
            where: {
                statusBayar: 'lancar',
                pinjaman: {
                    nasabahId,
                },
            },
        });
    }

    async getTotalPayments(nasabahId: number) {
        return await this.prisma.pembayaran.count({
            where: {
                pinjaman: {
                    nasabahId,
                },
            },
        });
    }

    async getDelinquencyPercentage(nasabahId: number) {
        const total = await this.getTotalPayments(nasabahId);
        if (total === 0) return 0;

        const late = await this.countLatePayments(nasabahId);
        return Math.round((late / total) * 100 * 100) / 100;
    }
}
