import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalisisRisikoResponseDto, AnalisisRisikoDetailDto } from './dto/analisis-risiko-response.dto';
import {
    calculatePekerjaanScore,
    calculatePenghasilanScore,
    calculateLamaBekerjaScore,
    calculateRiwayatPembayaranScore,
    calculateJumlahTanggunganScore,
    calculateTotalScore,
    determineKelayakanStatus,
} from './score-calculator';

type NasabahMinimalWithOptionalScoring = {
    id: number;
    nama: string;
    pekerjaan: string;
    penghasilan: number;
    saldoRataRata: number | null;
    estimasiPengeluaran: number | null;
    lamaBekerja?: number | null;
    riwayatPembayaran?: string | null;
    jumlahTanggungan?: number | null;
};

@Injectable()
export class RisikoAnalisisService {
    constructor(private readonly prisma: PrismaService) {}

    private buildDetail(scores: {
        skorPekerjaan: number;
        skorPenghasilan: number;
        skorLamaBekerja: number;
        skorRiwayat: number;
        skorTanggungan: number;
        pekerjaan: string;
        penghasilan: number;
        lamaBekerja: number;
        riwayatPembayaran: string;
        jumlahTanggungan: number;
    }): AnalisisRisikoDetailDto {
        return {
            pekerjaan: {
                skor: scores.skorPekerjaan,
                nilai: scores.pekerjaan,
            },
            penghasilan: {
                skor: scores.skorPenghasilan,
                nilai: scores.penghasilan,
            },
            lamaBekerja: {
                skor: scores.skorLamaBekerja,
                nilai: scores.lamaBekerja,
            },
            riwayatPembayaran: {
                skor: scores.skorRiwayat,
                nilai: scores.riwayatPembayaran,
            },
            jumlahTanggungan: {
                skor: scores.skorTanggungan,
                nilai: scores.jumlahTanggungan,
            },
            totalSkor: calculateTotalScore({
                skorPekerjaan: scores.skorPekerjaan,
                skorPenghasilan: scores.skorPenghasilan,
                skorLamaBekerja: scores.skorLamaBekerja,
                skorRiwayat: scores.skorRiwayat,
                skorTanggungan: scores.skorTanggungan,
            }),
            formula:
                'Pekerjaan × 0.30 + Penghasilan × 0.25 + Lama Bekerja × 0.15 + Riwayat Pembayaran × 0.20 + Jumlah Tanggungan × 0.10',
        };
    }

    async calculateAndSaveRiskAnalysis(idNasabah: number): Promise<AnalisisRisikoResponseDto> {
        const nasabah = (await this.prisma.nasabah.findUnique({
            where: { id: idNasabah },
            select: {
                id: true,
                nama: true,
                pekerjaan: true,
                penghasilan: true,
                saldoRataRata: true,
                estimasiPengeluaran: true,
            },
        })) as NasabahMinimalWithOptionalScoring | null;

        if (!nasabah) throw new NotFoundException('Nasabah tidak ditemukan');

        const pekerjaan = nasabah.pekerjaan || 'Tidak Bekerja';
        const penghasilan = nasabah.penghasilan || 0;
        const lamaBekerja = nasabah.lamaBekerja ?? 0;
        const riwayatPembayaran = nasabah.riwayatPembayaran?.trim() || 'Nasabah Baru';
        const jumlahTanggungan = nasabah.jumlahTanggungan ?? 0;

        const skorPekerjaan = calculatePekerjaanScore(pekerjaan);
        const skorPenghasilan = calculatePenghasilanScore(penghasilan);
        const skorLamaBekerja = calculateLamaBekerjaScore(lamaBekerja);
        const skorRiwayat = calculateRiwayatPembayaranScore(riwayatPembayaran);
        const skorTanggungan = calculateJumlahTanggunganScore(jumlahTanggungan);
        const totalSkor = calculateTotalScore({
            skorPekerjaan,
            skorPenghasilan,
            skorLamaBekerja,
            skorRiwayat,
            skorTanggungan,
        });
        const status = determineKelayakanStatus(totalSkor);

        const saved = await this.prisma.analisisRisiko.create({
            data: {
                nasabahId: idNasabah,
                skorPekerjaan,
                skorPenghasilan,
                skorLamaBekerja,
                skorRiwayat,
                skorTanggungan,
                totalSkor,
                status,
            },
        });

        return {
            id: saved.id,
            nasabahId: saved.nasabahId,
            namaNasabah: nasabah.nama,
            pekerjaan,
            penghasilan,
            lamaBekerja,
            riwayatPembayaran,
            jumlahTanggungan,
            skorPekerjaan,
            skorPenghasilan,
            skorLamaBekerja,
            skorRiwayat,
            skorTanggungan,
            totalSkor,
            status,
            detail: this.buildDetail({
                skorPekerjaan,
                skorPenghasilan,
                skorLamaBekerja,
                skorRiwayat,
                skorTanggungan,
                pekerjaan,
                penghasilan,
                lamaBekerja,
                riwayatPembayaran,
                jumlahTanggungan,
            }),
            createdAt: saved.createdAt,
        };
    }

    async getAnalisisHistory(idNasabah: number): Promise<AnalisisRisikoResponseDto[]> {
        const nasabah = (await this.prisma.nasabah.findUnique({
            where: { id: idNasabah },
            select: {
                id: true,
                nama: true,
                pekerjaan: true,
                penghasilan: true,
                saldoRataRata: true,
                estimasiPengeluaran: true,
            },
        })) as NasabahMinimalWithOptionalScoring | null;
        if (!nasabah) throw new NotFoundException('Nasabah tidak ditemukan');

        const records = await this.prisma.analisisRisiko.findMany({
            where: { nasabahId: idNasabah },
            orderBy: { createdAt: 'desc' },
        });

        return records.map((record) => ({
            id: record.id,
            nasabahId: record.nasabahId,
            namaNasabah: nasabah.nama,
            pekerjaan: nasabah.pekerjaan,
            penghasilan: nasabah.penghasilan,
            lamaBekerja: nasabah.lamaBekerja ?? 0,
            riwayatPembayaran: nasabah.riwayatPembayaran?.trim() || 'Nasabah Baru',
            jumlahTanggungan: nasabah.jumlahTanggungan ?? 0,
            skorPekerjaan: record.skorPekerjaan,
            skorPenghasilan: record.skorPenghasilan,
            skorLamaBekerja: record.skorLamaBekerja,
            skorRiwayat: record.skorRiwayat,
            skorTanggungan: record.skorTanggungan,
            totalSkor: record.totalSkor,
            status: record.status,
            detail: this.buildDetail({
                skorPekerjaan: record.skorPekerjaan,
                skorPenghasilan: record.skorPenghasilan,
                skorLamaBekerja: record.skorLamaBekerja,
                skorRiwayat: record.skorRiwayat,
                skorTanggungan: record.skorTanggungan,
                pekerjaan: nasabah.pekerjaan,
                penghasilan: nasabah.penghasilan,
                lamaBekerja: nasabah.lamaBekerja ?? 0,
                riwayatPembayaran: nasabah.riwayatPembayaran?.trim() || 'Nasabah Baru',
                jumlahTanggungan: nasabah.jumlahTanggungan ?? 0,
            }),
            createdAt: record.createdAt,
        }));
    }

    async getAllAnalisis(): Promise<AnalisisRisikoResponseDto[]> {
        const records = await this.prisma.analisisRisiko.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                nasabah: {
                    select: {
                        id: true,
                        nama: true,
                        pekerjaan: true,
                        penghasilan: true,
                        saldoRataRata: true,
                        estimasiPengeluaran: true,
                    },
                },
            },
        });

        return records.map((record) => {
            const nasabah = record.nasabah as NasabahMinimalWithOptionalScoring;
            const pekerjaan = nasabah.pekerjaan || 'Tidak Bekerja';
            const penghasilan = nasabah.penghasilan || 0;
            const lamaBekerja = nasabah.lamaBekerja ?? 0;
            const riwayatPembayaran = nasabah.riwayatPembayaran?.trim() || 'Nasabah Baru';
            const jumlahTanggungan = nasabah.jumlahTanggungan ?? 0;

            return {
                id: record.id,
                nasabahId: record.nasabahId,
                namaNasabah: nasabah.nama,
                pekerjaan,
                penghasilan,
                lamaBekerja,
                riwayatPembayaran,
                jumlahTanggungan,
                skorPekerjaan: record.skorPekerjaan,
                skorPenghasilan: record.skorPenghasilan,
                skorLamaBekerja: record.skorLamaBekerja,
                skorRiwayat: record.skorRiwayat,
                skorTanggungan: record.skorTanggungan,
                totalSkor: record.totalSkor,
                status: record.status,
                detail: this.buildDetail({
                    skorPekerjaan: record.skorPekerjaan,
                    skorPenghasilan: record.skorPenghasilan,
                    skorLamaBekerja: record.skorLamaBekerja,
                    skorRiwayat: record.skorRiwayat,
                    skorTanggungan: record.skorTanggungan,
                    pekerjaan,
                    penghasilan,
                    lamaBekerja,
                    riwayatPembayaran,
                    jumlahTanggungan,
                }),
                createdAt: record.createdAt,
            };
        });
    }
}
