import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePinjamanDto } from './dto/create-pinjaman.dto';
import { UpdatePinjamanDto } from './dto/update-pinjaman.dto';

@Injectable()
export class PinjamanService {
    constructor(private prisma: PrismaService) { }

    /**
     * Calculate monthly installment and total interest
     * @param jumlahPinjaman Loan amount
     * @param sukuBunga Interest rate (%)
     * @param tenor Loan duration (months)
     * @param jenisBunga Interest type (flat/efektif)
     */
    private calculateInstallment(
        jumlahPinjaman: number,
        sukuBunga: number,
        tenor: number,
        jenisBunga: 'flat' | 'efektif',
    ) {
        let totalBunga = 0;
        let cicilanBulanan = 0;

        if (jenisBunga === 'flat') {
            // Flat interest calculation
            totalBunga = (jumlahPinjaman * sukuBunga * tenor) / 100;
            cicilanBulanan = (jumlahPinjaman + totalBunga) / tenor;
        } else {
            // Efektif (compound) interest calculation
            const monthlyRate = sukuBunga / 100 / 12;
            cicilanBulanan =
                (jumlahPinjaman * monthlyRate * Math.pow(1 + monthlyRate, tenor)) /
                (Math.pow(1 + monthlyRate, tenor) - 1);
            totalBunga = cicilanBulanan * tenor - jumlahPinjaman;
        }

        const totalPembayaran = jumlahPinjaman + totalBunga;

        return {
            cicilanBulanan: Math.round(cicilanBulanan * 100) / 100,
            totalBunga: Math.round(totalBunga * 100) / 100,
            totalPembayaran: Math.round(totalPembayaran * 100) / 100,
        };
    }

    async create(createPinjamanDto: CreatePinjamanDto) {
        const { jumlahPinjaman, sukuBunga, tenor, jenisBunga } = createPinjamanDto;

        const calculations = this.calculateInstallment(
            jumlahPinjaman,
            sukuBunga,
            tenor,
            jenisBunga,
        );

        return await this.prisma.pinjaman.create({
            data: {
                ...createPinjamanDto,
                ...calculations,
            },
        });
    }

    async findAll() {
        return await this.prisma.pinjaman.findMany({
            include: {
                nasabah: true,
                pembayaran: true,
            },
        });
    }

    async findOne(id: number) {
        return await this.prisma.pinjaman.findUnique({
            where: { id },
            include: {
                nasabah: true,
                pembayaran: true,
            },
        });
    }

    async findByNasabah(nasabahId: number) {
        return await this.prisma.pinjaman.findMany({
            where: { nasabahId },
            include: {
                pembayaran: true,
            },
        });
    }

    async update(id: number, updatePinjamanDto: UpdatePinjamanDto) {
        return await this.prisma.pinjaman.update({
            where: { id },
            data: updatePinjamanDto,
        });
    }

    async remove(id: number) {
        return await this.prisma.pinjaman.delete({
            where: { id },
        });
    }

    async getActiveLoan(nasabahId: number) {
        return await this.prisma.pinjaman.findMany({
            where: {
                nasabahId,
                status: 'active',
            },
        });
    }

    async countActiveLoan(nasabahId: number) {
        return await this.prisma.pinjaman.count({
            where: {
                nasabahId,
                status: 'active',
            },
        });
    }
}
