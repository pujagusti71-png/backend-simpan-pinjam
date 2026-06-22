import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalisisPerPekerjaanDto, RisikoPerPekerjaanResponse } from './dto/analisis-pekerjaan.dto';

@Injectable()
export class AnalisisPekerjaanService {
    constructor(private prisma: PrismaService) { }

    /**
     * Categorize risk level based on delinquency percentage
     */
    private categorizeRiskByDelinquency(persentase: number): 'rendah' | 'sedang' | 'tinggi' {
        if (persentase <= 10) return 'rendah';
        if (persentase <= 30) return 'sedang';
        return 'tinggi';
    }

    /**
     * Get analysis by job type (pekerjaan)
     */
    async getAnalisisByPekerjaan(): Promise<RisikoPerPekerjaanResponse> {
        // Get all unique job types
        const pekerjaanList = await this.prisma.nasabah.findMany({
            distinct: ['pekerjaan'],
            select: { pekerjaan: true },
        });

        const analisisList: AnalisisPerPekerjaanDto[] = [];
        let risikoTinggi = 0;
        let risikoSedang = 0;
        let risikoRendah = 0;

        for (const { pekerjaan } of pekerjaanList) {
            // Get all nasabah with this job type
            const nasabahPekerjaan = await this.prisma.nasabah.findMany({
                where: { pekerjaan },
                select: {
                    id: true,
                    nama: true,
                    pekerjaan: true,
                    penghasilan: true,
                    pinjaman: {
                        include: {
                            pembayaran: true,
                        },
                    },
                },
            });

            const totalNasabah = nasabahPekerjaan.length;

            if (totalNasabah === 0) continue;

            // Calculate delinquency
            let totalPayments = 0;
            let latePayments = 0;
            let onTimePayments = 0;
            let totalPenghasilan = 0;
            let totalRasioCikilan = 0;
            let nasabahDenganPinjaman = 0;

            for (const nasabah of nasabahPekerjaan) {
                totalPenghasilan += nasabah.penghasilan;

                // Count payments
                for (const pinjaman of nasabah.pinjaman) {
                    if (pinjaman.cicilanBulanan) {
                        totalRasioCikilan += (pinjaman.cicilanBulanan / nasabah.penghasilan) * 100;
                        nasabahDenganPinjaman++;
                    }

                    for (const pembayaran of pinjaman.pembayaran) {
                        totalPayments++;
                        if (pembayaran.statusBayar === 'telat') {
                            latePayments++;
                        } else if (pembayaran.statusBayar === 'lancar') {
                            onTimePayments++;
                        }
                    }
                }
            }

            const persentaseKeterlambatan =
                totalPayments > 0 ? (latePayments / totalPayments) * 100 : 0;
            const rataRataPenghasilan = totalPenghasilan / totalNasabah;
            const rataRataRasioCikilan =
                nasabahDenganPinjaman > 0 ? totalRasioCikilan / nasabahDenganPinjaman : 0;

            // Categorize risk
            const tingkatRisiko = this.categorizeRiskByDelinquency(persentaseKeterlambatan);

            // Count risk categories
            if (tingkatRisiko === 'tinggi') risikoTinggi++;
            else if (tingkatRisiko === 'sedang') risikoSedang++;
            else risikoRendah++;

            analisisList.push({
                pekerjaan,
                totalNasabah,
                nasabahTelat: latePayments,
                nasabahLancar: onTimePayments,
                persentaseKeterlambatan: Math.round(persentaseKeterlambatan * 100) / 100,
                rataRataPenghasilan: Math.round(rataRataPenghasilan * 100) / 100,
                rataRataRasioCikilan: Math.round(rataRataRasioCikilan * 100) / 100,
                tingkatRisiko,
            });
        }

        return {
            data: analisisList.sort((a, b) => b.persentaseKeterlambatan - a.persentaseKeterlambatan),
            summary: {
                totalPekerjaan: analisisList.length,
                tingkatRisikoTinggi: risikoTinggi,
                tingkatRisikoSedang: risikoSedang,
                tingkatRisikoRendah: risikoRendah,
            },
        };
    }

    /**
     * Get job types with high risk
     */
    async getHighRiskJobs() {
        const analisis = await this.getAnalisisByPekerjaan();
        return analisis.data.filter((item) => item.tingkatRisiko === 'tinggi');
    }

    /**
     * Get statistics for specific job type
     */
    async getStatistikPerPekerjaan(pekerjaan: string) {
        const nasabahPekerjaan = await this.prisma.nasabah.findMany({
            where: { pekerjaan },
            select: {
                id: true,
                nama: true,
                pekerjaan: true,
                penghasilan: true,
                pinjaman: {
                    include: {
                        pembayaran: true,
                    },
                },
                risikoNasabah: true,
            },
        });

        if (nasabahPekerjaan.length === 0) {
            return { error: `Tidak ada data untuk pekerjaan: ${pekerjaan}` };
        }

        // Calculate statistics
        let totalNasabah = 0;
        let nasabahDenganPinjaman = 0;
        let nasabahBelumPinjam = 0;
        let nasabahTelat = new Set();
        let nasabahLancar = new Set();
        let risikoTinggiCount = 0;
        let risikoSedangCount = 0;
        let risikoRendahCount = 0;
        let totalPenghasilan = 0;
        let totalCicilan = 0;

        for (const nasabah of nasabahPekerjaan) {
            totalNasabah++;
            totalPenghasilan += nasabah.penghasilan;

            if (nasabah.pinjaman.length === 0) {
                nasabahBelumPinjam++;
            } else {
                nasabahDenganPinjaman++;

                for (const pinjaman of nasabah.pinjaman) {
                    if (pinjaman.cicilanBulanan) {
                        totalCicilan += pinjaman.cicilanBulanan;
                    }

                    for (const pembayaran of pinjaman.pembayaran) {
                        if (pembayaran.statusBayar === 'telat') {
                            nasabahTelat.add(nasabah.id);
                        } else {
                            nasabahLancar.add(nasabah.id);
                        }
                    }
                }
            }

            if (nasabah.risikoNasabah) {
                if (nasabah.risikoNasabah.kategoriRisiko === 'tinggi') risikoTinggiCount++;
                else if (nasabah.risikoNasabah.kategoriRisiko === 'sedang') risikoSedangCount++;
                else risikoRendahCount++;
            }
        }

        return {
            pekerjaan,
            totalNasabah,
            nasabahDenganPinjaman,
            nasabahBelumPinjam,
            nasabahTelat: nasabahTelat.size,
            nasabahLancar: nasabahLancar.size,
            rataRataPenghasilan: Math.round((totalPenghasilan / totalNasabah) * 100) / 100,
            totalCicilanBulanan: Math.round(totalCicilan * 100) / 100,
            rataRataRasioCikilan:
                nasabahDenganPinjaman > 0
                    ? Math.round(((totalCicilan / nasabahDenganPinjaman) / (totalPenghasilan / totalNasabah)) * 100 * 100) / 100
                    : 0,
            risikoTinggi: risikoTinggiCount,
            risikoSedang: risikoSedangCount,
            risikoRendah: risikoRendahCount,
        };
    }

    /**
     * Update or create AnalisisPerPekerjaan records
     */
    async updateAnalisisPerPekerjaan() {
        const analisis = await this.getAnalisisByPekerjaan();

        for (const item of analisis.data) {
            // Check if record exists
            const existing = await this.prisma.analisisPerPekerjaan.findUnique({
                where: { pekerjaan: item.pekerjaan },
            });

            if (existing) {
                // Update
                await this.prisma.analisisPerPekerjaan.update({
                    where: { pekerjaan: item.pekerjaan },
                    data: {
                        nasabahTelat: item.nasabahTelat,
                        nasabahLancar: item.nasabahLancar,
                        persentaseKeterlambatan: item.persentaseKeterlambatan,
                        rataRataPenghasilan: item.rataRataPenghasilan,
                        rataRataRasioCikilan: item.rataRataRasioCikilan,
                        tingkatRisiko: item.tingkatRisiko,
                    },
                });
            } else {
                // Create
                await this.prisma.analisisPerPekerjaan.create({
                    data: {
                        pekerjaan: item.pekerjaan,
                        totalNasabah: item.totalNasabah,
                        nasabahTelat: item.nasabahTelat,
                        nasabahLancar: item.nasabahLancar,
                        persentaseKeterlambatan: item.persentaseKeterlambatan,
                        rataRataPenghasilan: item.rataRataPenghasilan,
                        rataRataRasioCikilan: item.rataRataRasioCikilan,
                        tingkatRisiko: item.tingkatRisiko,
                    },
                });
            }
        }

        return { message: 'Analisis per pekerjaan berhasil diperbarui', totalRecords: analisis.data.length };
    }
}
