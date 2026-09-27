import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRiwayatKreditDto } from './dto/create-riwayat-kredit.dto';
import { AnalisisRisikoService } from '../analisis-risiko/analisis-risiko.service';

@Injectable()
export class RiwayatKreditService {
    constructor(
        private prisma: PrismaService,
        private analisisRisikoService: AnalisisRisikoService,
    ) { }

    async create(createRiwayatKreditDto: CreateRiwayatKreditDto) {
        const created = await this.prisma.riwayatKredit.create({
            data: createRiwayatKreditDto,
        });

        // Data SLIK/BI-checking baru masuk -> perbarui skor risiko nasabah.
        await this.analisisRisikoService.recomputeForNasabah(created.nasabahId).catch((err) => {
            console.error('Gagal menghitung ulang risiko setelah riwayat kredit:', err);
        });

        return created;
    }

    async findByNasabah(nasabahId: number) {
        return await this.prisma.riwayatKredit.findFirst({
            where: { nasabahId },
        });
    }

    async update(id: number, updateData: any) {
        return await this.prisma.riwayatKredit.update({
            where: { id },
            data: updateData,
        });
    }
}
