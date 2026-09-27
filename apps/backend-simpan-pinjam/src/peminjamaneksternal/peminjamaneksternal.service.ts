import { Injectable, NotFoundException } from '@nestjs/common';
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

    async getBICheckingSummary(nasabahId: number) {
        const nasabah = await this.prisma.nasabah.findUnique({
            where: { id: nasabahId },
            select: { id: true, nama: true, nik: true },
        });
        if (!nasabah) {
            throw new NotFoundException(`Nasabah ID ${nasabahId} tidak ditemukan`);
        }

        const eksternalList = await this.prisma.peminjamanEksternal.findMany({
            where: { nasabahId },
        });

        const totalJumlahEksternal = eksternalList.reduce(
            (sum, e) => sum + Number(e.jumlahPinjaman ?? 0),
            0,
        );
        const kolektibilitasList = eksternalList.map((e) => e.kolektibilitas);
        const pernahMacet = eksternalList.some((e) => {
            const kol = String(e.kolektibilitas || '').toLowerCase();
            return (
                kol.includes('macet') ||
                kol.includes('diragukan') ||
                kol.includes('kurang lancar') ||
                ['3', '4', '5'].includes(kol)
            );
        });
        const statusBI = pernahMacet ? 'bermasalah' : 'aman';

        let catatan: string | null = null;
        const macetEntries = eksternalList
            .filter((e) => {
                const kol = String(e.kolektibilitas || '').toLowerCase();
                return (
                    kol.includes('macet') ||
                    kol.includes('diragukan') ||
                    kol.includes('kurang lancar') ||
                    ['3', '4', '5'].includes(kol)
                );
            })
            .map((e) => `${e.sumberPinjaman} (Kolektibilitas ${e.kolektibilitas})`);
        if (macetEntries.length > 0) {
            catatan = `Pinjaman bermasalah: ${macetEntries.join(', ')}`;
        }

        return {
            nasabahId,
            nama: nasabah.nama,
            nik: nasabah.nik,
            totalPinjamanAktif: eksternalList.length,
            totalJumlahEksternal,
            statusBI,
            pernahMacet,
            kolektibilitasList,
            catatan,
        };
    }
}
