import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePeminjamanEksternalDto } from './dto/create-peminjamaneksternal.dto';

@Injectable()
export class PeminjamanEksternalService {
    constructor(private prisma: PrismaService) { }

    async create(createPeminjamanEksternalDto: CreatePeminjamanEksternalDto) {
        return await this.prisma.peminjamanEksternal.create({
            data: createPeminjamanEksternalDto,
        });
    }

    async findAll() {
        return await this.prisma.peminjamanEksternal.findMany();
    }

    async findByNasabah(nasabahId: number) {
        return await this.prisma.peminjamanEksternal.findMany({
            where: { nasabahId },
        });
    }

    async remove(id: number) {
        return await this.prisma.peminjamanEksternal.delete({
            where: { id },
        });
    }

    async getTotalExternalLoan(nasabahId: number) {
        const result = await this.prisma.peminjamanEksternal.aggregate({
            _sum: { jumlahPinjaman: true },
            where: { nasabahId },
        });

        return result._sum.jumlahPinjaman || 0;
    }
}
