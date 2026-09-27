import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePeminjamanEksternalDto } from './dto/create-peminjamaneksternal.dto';
import { AnalisisRisikoService } from '../analisis-risiko/analisis-risiko.service';

@Injectable()
export class PeminjamanEksternalService {
    constructor(
        private prisma: PrismaService,
        private analisisRisikoService: AnalisisRisikoService,
    ) { }

    async create(createPeminjamanEksternalDto: CreatePeminjamanEksternalDto) {
        const created = await this.prisma.peminjamanEksternal.create({
            data: createPeminjamanEksternalDto,
        });

        // Data pinjaman eksternal baru masuk -> perbarui skor risiko nasabah.
        await this.analisisRisikoService.recomputeForNasabah(created.nasabahId).catch((err) => {
            console.error('Gagal menghitung ulang risiko setelah pinjaman eksternal:', err);
        });

        return created;
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
