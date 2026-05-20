import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNasabahDto } from './dto/create-nasabah.dto';
import { UpdateNasabahDto } from './dto/update-nasabah.dto';

@Injectable()
export class NasabahService {
    constructor(private prisma: PrismaService) { }

    async create(createNasabahDto: CreateNasabahDto) {
        return await this.prisma.nasabah.create({
            data: createNasabahDto,
        });
    }

    async findAll() {
        return await this.prisma.nasabah.findMany({
            include: {
                pinjaman: true,
                risikoNasabah: true,
                riwayatKredit: true,
            },
        });
    }

    async findOne(id: number) {
        return await this.prisma.nasabah.findUnique({
            where: { id },
            include: {
                pinjaman: true,
                riwayatKredit: true,
                peminjamanEksternal: true,
                risikoNasabah: true,
            },
        });
    }

    async findByNIK(nik: string) {
        return await this.prisma.nasabah.findUnique({
            where: { nik },
            include: {
                pinjaman: true,
                risikoNasabah: true,
                riwayatKredit: true,
            },
        });
    }

    async update(id: number, updateNasabahDto: UpdateNasabahDto) {
        const updateData: any = {};

        if (updateNasabahDto.nama !== undefined) updateData.nama = updateNasabahDto.nama;
        if (updateNasabahDto.pekerjaan !== undefined) updateData.pekerjaan = updateNasabahDto.pekerjaan;
        if (updateNasabahDto.penghasilan !== undefined) updateData.penghasilan = updateNasabahDto.penghasilan;
        if (updateNasabahDto.saldoRataRata !== undefined) updateData.saldoRataRata = updateNasabahDto.saldoRataRata;
        if (updateNasabahDto.estimasiPengeluaran !== undefined) updateData.estimasiPengeluaran = updateNasabahDto.estimasiPengeluaran;

        return await this.prisma.nasabah.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(id: number) {
        return await this.prisma.nasabah.delete({
            where: { id },
        });
    }

    async getAllByPekerjaan(pekerjaan: string) {
        return await this.prisma.nasabah.findMany({
            where: { pekerjaan },
        });
    }
}
