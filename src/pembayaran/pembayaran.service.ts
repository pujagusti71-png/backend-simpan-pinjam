import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePembayaranDto } from './dto/create-pembayaran.dto';

@Injectable()
export class PembayaranService {
    constructor(private prisma: PrismaService) { }

    private toDate(value?: string | Date) {
        if (!value) return new Date();
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            throw new BadRequestException('Tanggal tidak valid. Gunakan format ISO 8601.');
        }
        return parsed;
    }

    private roundCurrency(value: number) {
        return Math.round(Number(value || 0));
    }

    private getInstallmentBreakdown(pinjaman: any, nomorCicilan: number) {
        const jumlahPinjaman = Number(pinjaman.jumlahPinjaman ?? 0);
        const totalBunga = Number(pinjaman.totalBunga ?? 0);
        const tenor = Number(pinjaman.tenor ?? 0);

        const pokokCicilan = tenor > 0 ? jumlahPinjaman / tenor : 0;
        const bungaBase = tenor > 0 ? Math.floor(totalBunga / tenor) : 0;
        const bungaRemainder = tenor > 0 ? totalBunga - (bungaBase * tenor) : 0;
        const bungaCicilan = tenor > 0 && nomorCicilan === tenor
            ? bungaBase + bungaRemainder
            : bungaBase;
        const totalBayar = pokokCicilan + bungaCicilan;

        return {
            nomorCicilan,
            jumlahPokok: this.roundCurrency(pokokCicilan),
            jumlahBunga: this.roundCurrency(bungaCicilan),
            jumlahBayar: this.roundCurrency(totalBayar),
        };
    }

    private getPaymentSummary(pinjaman: any) {
        const pembayaran = Array.isArray(pinjaman.pembayaran) ? pinjaman.pembayaran : [];
        const totalPokok = pembayaran.reduce((acc, payment) => acc + Number(payment.jumlahPokok ?? 0), 0);
        const totalBunga = pembayaran.reduce((acc, payment) => acc + Number(payment.jumlahBunga ?? 0), 0);
        const totalBayar = pembayaran.reduce((acc, payment) => acc + Number(payment.jumlahBayar ?? 0), 0);

        return {
            totalPokok,
            totalBunga,
            totalBayar,
            sisaPinjaman: Number(pinjaman.jumlahPinjaman ?? 0) - totalPokok,
            sisaBunga: Number(pinjaman.totalBunga ?? 0) - totalBunga,
            sisaCicilan: Math.max(0, Number(pinjaman.tenor ?? 0) - pembayaran.length),
        };
    }

    private async getPinjamanForPayment(pinjamanId: number) {
        const pinjaman = await this.prisma.pinjaman.findUnique({
            where: { id: pinjamanId },
            include: { pembayaran: true },
        });

        if (!pinjaman) {
            throw new BadRequestException('Data pinjaman tidak ditemukan');
        }

        return pinjaman;
    }

    async create(createPembayaranDto: CreatePembayaranDto) {
        const pinjamanId = Number(createPembayaranDto.pinjamanId);
        if (!pinjamanId) {
            throw new BadRequestException('ID pinjaman wajib diisi');
        }

        const pinjaman = await this.getPinjamanForPayment(pinjamanId);
        const tenor = Number(pinjaman.tenor ?? 0);

        if (pinjaman.status === 'lunas' || (pinjaman.pembayaran?.length ?? 0) >= tenor) {
            throw new BadRequestException('pinjaman sudah lunas');
        }

        const jumlahBayar = Number(createPembayaranDto.jumlahBayar ?? 0);
        if (!Number.isFinite(jumlahBayar) || jumlahBayar <= 0) {
            throw new BadRequestException('Nilai pembayaran negatif atau 0 tidak diperbolehkan');
        }

        const nextNomorCicilan = (pinjaman.pembayaran?.length ?? 0) + 1;
        if (nextNomorCicilan > tenor) {
            throw new BadRequestException('Semua cicilan untuk pinjaman ini sudah dibayar');
        }

        const existingNomor = pinjaman.pembayaran?.some((payment) => Number(payment.nomorCicilan ?? 0) === nextNomorCicilan);
        if (existingNomor) {
            throw new BadRequestException('Nomor cicilan duplicate untuk pinjaman yang sama');
        }

        const summary = this.getPaymentSummary(pinjaman);
        const remainingObligation = Number(pinjaman.jumlahPinjaman ?? 0) + Number(pinjaman.totalBunga ?? 0) - summary.totalBayar;
        if (jumlahBayar > remainingObligation) {
            throw new BadRequestException('Pembayaran melebihi sisa kewajiban');
        }

        const installment = this.getInstallmentBreakdown(pinjaman, nextNomorCicilan);
        const tanggalPembayaran = this.toDate(createPembayaranDto.tanggalPembayaran ?? createPembayaranDto.tanggalBayar);
        const tanggalBayar = this.toDate(createPembayaranDto.tanggalBayar ?? createPembayaranDto.tanggalPembayaran);

        const data: any = {
            pinjamanId,
            nomorCicilan: nextNomorCicilan,
            jumlahPokok: createPembayaranDto.jumlahPokok ?? installment.jumlahPokok,
            jumlahBunga: createPembayaranDto.jumlahBunga ?? installment.jumlahBunga,
            jumlahBayar: jumlahBayar,
            tanggalPembayaran,
            tanggalBayar,
            statusBayar: createPembayaranDto.statusBayar ?? 'lancar',
            dariTanggalSeharusnya: createPembayaranDto.dariTanggalSeharusnya ? this.toDate(createPembayaranDto.dariTanggalSeharusnya) : undefined,
        };

        const createdPayment = await this.prisma.pembayaran.create({ data });

        const updatedPayments = await this.prisma.pembayaran.findMany({ where: { pinjamanId } });
        const totalPaid = updatedPayments.reduce((sum, payment) => sum + Number(payment.jumlahBayar ?? 0), 0);
        const totalQuoted = Number(pinjaman.jumlahPinjaman ?? 0) + Number(pinjaman.totalBunga ?? 0);
        const statusPinjaman = totalPaid >= totalQuoted ? 'lunas' : 'active';

        await this.prisma.pinjaman.update({
            where: { id: pinjamanId },
            data: {
                status: statusPinjaman,
                tanggalSelesai: statusPinjaman === 'lunas' ? new Date() : pinjaman.tanggalSelesai,
            },
        });

        return {
            ...createdPayment,
            nomorCicilan: nextNomorCicilan,
            jumlahPokok: createPembayaranDto.jumlahPokok ?? installment.jumlahPokok,
            jumlahBunga: createPembayaranDto.jumlahBunga ?? installment.jumlahBunga,
            jumlahBayar: jumlahBayar,
        };
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
            orderBy: {
                tanggalPembayaran: 'asc',
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
            orderBy: { nomorCicilan: 'asc' },
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
            orderBy: {
                tanggalPembayaran: 'asc',
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
