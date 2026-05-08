import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PembayaranService } from '../pembayaran/pembayaran.service';
import { PinjamanService } from '../pinjaman/pinjaman.service';
import { UpdateRiwayatKreditDto } from './dto/update-riwayat-kredit.dto';

@Injectable()
export class RisikoAnalisisService {
    constructor(
        private prisma: PrismaService,
        private pembayaranService: PembayaranService,
        private pinjamanService: PinjamanService,
    ) { }

    /**
     * Calculate installment ratio (cicilan / penghasilan x 100%)
     */
    calculateRasioSiklusPersentase(cicilan: number, penghasilan: number): number {
        if (penghasilan === 0) return 100;
        return Math.round((cicilan / penghasilan) * 100 * 100) / 100;
    }

    /**
     * Calculate risk score based on multiple factors (0-100)
     */
    async calculateRiskScore(nasabahId: number): Promise<number> {
        const nasabah = await this.prisma.nasabah.findUnique({
            where: { id: nasabahId },
            include: {
                pinjaman: true,
                riwayatKredit: true,
                peminjamanEksternal: true,
            },
        });

        if (!nasabah) return 0;

        let score = 0;

        // 1. Ratio Cicilan (max 40 points)
        const activeLoan = nasabah.pinjaman.find((p) => p.status === 'active');
        if (activeLoan && activeLoan.cicilanBulanan) {
            const ratio = this.calculateRasioSiklusPersentase(
                activeLoan.cicilanBulanan,
                nasabah.penghasilan,
            );

            if (ratio > 50) score += 40;
            else if (ratio > 35) score += 25;
            else if (ratio > 20) score += 15;
            else if (ratio > 10) score += 5;
        }

        // 2. Payment History (max 30 points)
        const delinquency =
            await this.pembayaranService.getDelinquencyPercentage(nasabahId);
        if (delinquency > 30) score += 30;
        else if (delinquency > 20) score += 20;
        else if (delinquency > 10) score += 10;
        else if (delinquency > 0) score += 5;

        // 3. BI Checking (max 20 points)
        const biChecking = nasabah.riwayatKredit[0];
        if (biChecking) {
            if (biChecking.pernahMacet) score += 20;
            else if (biChecking.statusBI === 'bermasalah') score += 15;
            else if (biChecking.totalPinjamanAktif > 5) score += 10;
            else if (biChecking.totalPinjamanAktif > 3) score += 5;
        }

        // 4. External Loans (max 10 points)
        const totalExternalLoans = nasabah.peminjamanEksternal.length;
        if (totalExternalLoans > 5) score += 10;
        else if (totalExternalLoans > 3) score += 7;
        else if (totalExternalLoans > 1) score += 4;

        return Math.min(score, 100);
    }

    /**
     * Categorize risk level
     */
    categorizeRiskLevel(score: number): 'rendah' | 'sedang' | 'tinggi' {
        if (score <= 30) return 'rendah';
        if (score <= 60) return 'sedang';
        return 'tinggi';
    }

    /**
     * Decision Support System
     */
    makeDecision(
        riskScore: number,
        riskCategory: string,
        delinquency: number,
    ): 'approve' | 'review' | 'reject' {
        // Automatic rejection cases
        if (riskScore >= 80 || delinquency > 50) return 'reject';

        // Automatic approval cases
        if (riskScore <= 30 && delinquency <= 5) return 'approve';

        // Review cases
        return 'review';
    }

    /**
     * Detect risky behavior patterns
     */
    async detectRiskyBehavior(nasabahId: number): Promise<string[]> {
        const nasabah = await this.prisma.nasabah.findUnique({
            where: { id: nasabahId },
            include: {
                pinjaman: true,
            },
        });

        const riskIndicators: string[] = [];

        if (!nasabah) return riskIndicators;

        // Check loan frequency
        const pinjamanPerBulan = nasabah.pinjaman.filter((p) => {
            const created = new Date(p.createdAt);
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            return created > oneMonthAgo;
        }).length;

        if (pinjamanPerBulan >= 3)
            riskIndicators.push('Frekuensi pinjaman tinggi (3+ dalam sebulan)');

        // Check number of active loans
        const activeLoanCount = nasabah.pinjaman.filter(
            (p) => p.status === 'active',
        ).length;
        if (activeLoanCount > 5)
            riskIndicators.push(
                `Jumlah pinjaman aktif tinggi (${activeLoanCount} pinjaman)`,
            );

        // Check for consecutive late payments
        const payments = await this.pembayaranService.findByNasabah(nasabahId);
        let consecutiveLate = 0;
        for (const payment of payments) {
            if (payment.statusBayar === 'telat') {
                consecutiveLate++;
                if (consecutiveLate >= 3) {
                    riskIndicators.push('Keterlambatan berturut-turut 3+ kali');
                    break;
                }
            } else {
                consecutiveLate = 0;
            }
        }

        // Check loan repetition pattern
        if (activeLoanCount > 1 && pinjamanPerBulan > 1) {
            riskIndicators.push('Pola pinjaman berulang dengan cepat');
        }

        return riskIndicators;
    }

    /**
     * Get full risk analysis for a nasabah
     */
    async getRiskAnalysis(nasabahId: number) {
        const nasabah = await this.prisma.nasabah.findUnique({
            where: { id: nasabahId },
            include: {
                pinjaman: true,
                riwayatKredit: true,
                peminjamanEksternal: true,
            },
        });

        if (!nasabah) throw new Error('Nasabah tidak ditemukan');

        // Get active loan
        const activeLoan = nasabah.pinjaman.find((p) => p.status === 'active');

        // Pre-Loan Checking
        const cicilan = activeLoan?.cicilanBulanan || 0;
        const rasio = this.calculateRasioSiklusPersentase(cicilan, nasabah.penghasilan);

        // BI Checking
        const biChecking = nasabah.riwayatKredit[0] || {
            totalPinjamanAktif: 0,
            statusBI: 'aman',
            kolektibilitas: 'lancar',
            pernahMacet: false,
        };

        // Payment History
        const totalPayments = await this.pembayaranService.getTotalPayments(nasabahId);
        const latePayments = await this.pembayaranService.countLatePayments(nasabahId);
        const onTimePayments = await this.pembayaranService.countOnTimePayments(nasabahId);
        const delinquency = await this.pembayaranService.getDelinquencyPercentage(nasabahId);

        // Risk Score
        const riskScore = await this.calculateRiskScore(nasabahId);
        const riskCategory = this.categorizeRiskLevel(riskScore);
        const decision = this.makeDecision(riskScore, riskCategory, delinquency);

        // Behavior Detection
        const behaviorRisks = await this.detectRiskyBehavior(nasabahId);
        const frekuensiPinjaman = nasabah.pinjaman.length;
        const pola = behaviorRisks;
        const risikoAktivitas =
            behaviorRisks.length > 0 ? 'Tinggi - Ada indikasi berisiko' : 'Normal';

        return {
            nasabahId,
            rasioSiklusPersentase: rasio,
            skorRisiko: riskScore,
            kategoriRisiko: riskCategory,
            persentaseKeterlambatan: delinquency,
            frekuensiPinjaman,
            penjumlahPeminjamanAktif: nasabah.pinjaman.filter(
                (p) => p.status === 'active',
            ).length,
            indikasiBehaviorBerisiko: behaviorRisks.join('; '),
            rekomendasi: decision,
            detailAnalisis: {
                preLoanChecking: {
                    penghasilan: nasabah.penghasilan,
                    cicilan,
                    rasio,
                    status: rasio > 50 ? 'Berisiko Tinggi' : rasio > 35 ? 'Berisiko Sedang' : 'Aman',
                },
                biChecking: {
                    totalPinjamanAktif: biChecking.totalPinjamanAktif,
                    statusBI: biChecking.statusBI,
                    kolektibilitas: biChecking.kolektibilitas,
                },
                riwayatPembayaran: {
                    totalPembayaran: totalPayments,
                    telat: latePayments,
                    lancar: onTimePayments,
                    persentaseTelat: delinquency,
                },
                behaviorDetection: {
                    frekuensi: frekuensiPinjaman,
                    pola,
                    risikoAktivitas,
                },
            },
        };
    }

    /**
     * Create or update risk profile
     */
    async createOrUpdateRiskProfile(nasabahId: number) {
        const analysis = await this.getRiskAnalysis(nasabahId);

        const existing = await this.prisma.risikoNasabah.findUnique({
            where: { nasabahId },
        });

        if (existing) {
            return await this.prisma.risikoNasabah.update({
                where: { nasabahId },
                data: {
                    rasioSiklusPersentase: analysis.rasioSiklusPersentase,
                    skorRisiko: analysis.skorRisiko,
                    kategoriRisiko: analysis.kategoriRisiko,
                    persentaseKeterlambatan: analysis.persentaseKeterlambatan,
                    frekuensiPinjaman: analysis.frekuensiPinjaman,
                    penjumlahPeminjamanAktif: analysis.penjumlahPeminjamanAktif,
                    indikasiBehaviorBerisiko: analysis.indikasiBehaviorBerisiko,
                    rekomendasi: analysis.rekomendasi,
                },
            });
        }

        return await this.prisma.risikoNasabah.create({
            data: {
                nasabahId,
                rasioSiklusPersentase: analysis.rasioSiklusPersentase,
                skorRisiko: analysis.skorRisiko,
                kategoriRisiko: analysis.kategoriRisiko,
                persentaseKeterlambatan: analysis.persentaseKeterlambatan,
                frekuensiPinjaman: analysis.frekuensiPinjaman,
                penjumlahPeminjamanAktif: analysis.penjumlahPeminjamanAktif,
                indikasiBehaviorBerisiko: analysis.indikasiBehaviorBerisiko,
                rekomendasi: analysis.rekomendasi,
            },
        });
    }

    /**
     * Get analysis by job type
     */
    async getAnalysisByPekerjaan(pekerjaan: string) {
        const nasabahList = await this.prisma.nasabah.findMany({
            where: { pekerjaan },
            include: {
                pinjaman: true,
                risikoNasabah: true,
            },
        });

        const totalNasabah = nasabahList.length;
        if (totalNasabah === 0) {
            return {
                pekerjaan,
                totalNasabah: 0,
                nasabahTelat: 0,
                nasabahLancar: 0,
                persentaseKeterlambatan: 0,
                rataRataPenghasilan: 0,
                rataRataRasioCikilan: 0,
                tingkatRisiko: 'data-kosong',
            };
        }

        let nasabahTelat = 0;
        let nasabahLancar = 0;
        let totalPenghasilan = 0;
        let totalRasio = 0;

        for (const nasabah of nasabahList) {
            const delinquency = await this.pembayaranService.getDelinquencyPercentage(
                nasabah.id,
            );
            if (delinquency > 0) {
                nasabahTelat++;
            } else {
                nasabahLancar++;
            }

            totalPenghasilan += nasabah.penghasilan;

            const activeLoan = nasabah.pinjaman.find((p) => p.status === 'active');
            if (activeLoan && activeLoan.cicilanBulanan) {
                const rasio = this.calculateRasioSiklusPersentase(
                    activeLoan.cicilanBulanan,
                    nasabah.penghasilan,
                );
                totalRasio += rasio;
            }
        }

        const persentaseKeterlambatan = Math.round(
            (nasabahTelat / totalNasabah) * 100 * 100,
        ) / 100;
        const rataRataPenghasilan = Math.round(totalPenghasilan / totalNasabah);
        const rataRataRasioCikilan = Math.round((totalRasio / totalNasabah) * 100) / 100;

        let tingkatRisiko: 'tinggi' | 'sedang' | 'rendah' = 'rendah';
        if (persentaseKeterlambatan > 30) tingkatRisiko = 'tinggi';
        else if (persentaseKeterlambatan > 15) tingkatRisiko = 'sedang';

        return {
            pekerjaan,
            totalNasabah,
            nasabahTelat,
            nasabahLancar,
            persentaseKeterlambatan,
            rataRataPenghasilan,
            rataRataRasioCikilan,
            tingkatRisiko,
        };
    }

    /**
     * Get all job categories analysis
     */
    async getAllJobAnalysis() {
        const jobs = await this.prisma.nasabah.findMany({
            distinct: ['pekerjaan'],
            select: { pekerjaan: true },
        });

        const analysis: any[] = [];
        for (const job of jobs) {
            const jobAnalysis = await this.getAnalysisByPekerjaan(job.pekerjaan);
            analysis.push(jobAnalysis);
        }

        return analysis;
    }

    /**
     * Create or update BI checking data
     */
    async updateBIChecking(
        nasabahId: number,
        biCheckingDto: UpdateRiwayatKreditDto,
    ) {
        const existing = await this.prisma.riwayatKredit.findFirst({
            where: { nasabahId },
        });

        if (existing) {
            return await this.prisma.riwayatKredit.update({
                where: { id: existing.id },
                data: biCheckingDto,
            });
        }

        return await this.prisma.riwayatKredit.create({
            data: {
                nasabahId,
                totalPinjamanAktif: biCheckingDto.totalPinjamanAktif || 0,
                statusBI: biCheckingDto.statusBI || 'aman',
                kolektibilitas: biCheckingDto.kolektibilitas || 'lancar',
                pernahMacet: biCheckingDto.pernahMacet || false,
            },
        });
    }

    /**
     * Get dashboard data
     */
    async getDashboardData() {
        const totalNasabah = await this.prisma.nasabah.count();
        const totalPinjaman = await this.prisma.pinjaman.count();
        const totalPinjamanAktif = await this.prisma.pinjaman.count({
            where: { status: 'active' },
        });

        const allPayments = await this.prisma.pembayaran.findMany();
        const totalTelat = allPayments.filter((p) => p.statusBayar === 'telat').length;
        const totalLancar = allPayments.filter((p) => p.statusBayar === 'lancar').length;

        const risikoNasabah = await this.prisma.risikoNasabah.findMany();
        const kategoriCount = {
            rendah: risikoNasabah.filter((r) => r.kategoriRisiko === 'rendah').length,
            sedang: risikoNasabah.filter((r) => r.kategoriRisiko === 'sedang').length,
            tinggi: risikoNasabah.filter((r) => r.kategoriRisiko === 'tinggi').length,
        };

        const totalPeminjamanAktif = (
            await this.prisma.pinjaman.aggregate({
                _sum: { jumlahPinjaman: true },
                where: { status: 'active' },
            })
        )._sum.jumlahPinjaman || 0;

        return {
            totalNasabah,
            totalPinjaman,
            totalPinjamanAktif,
            totalPeminjamanAktif: Math.round(totalPeminjamanAktif),
            pembayaran: {
                telat: totalTelat,
                lancar: totalLancar,
                persentaseTelat:
                    totalTelat + totalLancar > 0
                        ? Math.round((totalTelat / (totalTelat + totalLancar)) * 100 * 100) / 100
                        : 0,
            },
            kategoriRisiko: kategoriCount,
        };
    }
}
