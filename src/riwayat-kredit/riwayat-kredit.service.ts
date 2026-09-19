import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRiwayatKreditDto } from './dto/create-riwayat-kredit.dto';

@Injectable()
export class RiwayatKreditService {
    constructor(private prisma: PrismaService) { }

    async create(createRiwayatKreditDto: CreateRiwayatKreditDto) {
        return await this.prisma.riwayatKredit.create({
            data: createRiwayatKreditDto,
        });
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
