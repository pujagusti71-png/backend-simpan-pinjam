import { Injectable, NotFoundException } from '@nestjs/common';
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
     * Pre-Loan Checking: Validate eligibility for new loan application
     */
    async preLoadChecking(nasabahId: number, proposedLoanAmount: number, proposedTenor: number) {
        const nasabah = await this.prisma.nasabah.findUnique({
            where: { id: nasabahId },
            include: {
                pinjaman: true,
                riwayatKredit: true,
                peminjamanEksternal: true,
            },
        });

        if (!nasabah) throw new NotFoundException('Nasabah tidak ditemukan');

        // Calculate proposed monthly installment (assuming flat interest of 2%)
        const bunga = 2; // Default 2% for estimation
        const tenor = proposedTenor || 12;
        const totalBunga = (proposedLoanAmount * bunga * tenor) / 100;
        const totalPembayaran = proposedLoanAmount + totalBunga;
        const cicilanBulanan = totalPembayaran / tenor;

        // Calculate new installment ratio if loan is approved
        const activeLoan = nasabah.pinjaman.find((p) => p.status === 'active');
        const totalCicilanDenganPinjamBaru = (activeLoan?.cicilanBulanan || 0) + cicilanBulanan;
        const rasioSebelum = activeLoan && activeLoan.cicilanBulanan
            ? this.calculateRasioSiklusPersentase(activeLoan.cicilanBulanan, nasabah.penghasilan)
            : 0;
        const rasioSesudah = this.calculateRasioSiklusPersentase(totalCicilanDenganPinjamBaru, nasabah.penghasilan);

        // Get payment history
        const totalPayments = await this.pembayaranService.getTotalPayments(nasabahId);
        const latePayments = await this.pembayaranService.countLatePayments(nasabahId);
        const delinquency = await this.pembayaranService.getDelinquencyPercentage(nasabahId);

        // BI Checking
        const biChecking = nasabah.riwayatKredit[0] || {
            totalPinjamanAktif: 0,
            statusBI: 'aman',
            kolektibilitas: 'lancar',
            pernahMacet: false,
        };

        // Determine eligibility
        let status = 'APPROVED';
        const reasons: string[] = [];

        if (rasioSesudah > 50) {
            status = 'REJECTED';
            reasons.push(`Rasio cicilan terlalu tinggi: ${rasioSesudah}% (max 50%)`);
        }

        if (delinquency > 30) {
            status = 'REJECTED';
            reasons.push(`Tingkat keterlambatan terlalu tinggi: ${delinquency}%`);
        }

        if (biChecking.pernahMacet) {
            if (status === 'APPROVED') status = 'REVIEW';
            reasons.push('Pernah mengalami keterlambatan pembayaran di masa lalu');
        }

        if (biChecking.totalPinjamanAktif > 5) {
            if (status === 'APPROVED') status = 'REVIEW';
            reasons.push(`Terlalu banyak pinjaman aktif: ${biChecking.totalPinjamanAktif} pinjaman`);
        }

        if (nasabah.peminjamanEksternal.length > 3) {
            if (status === 'APPROVED') status = 'REVIEW';
            reasons.push(`Banyak pinjaman di tempat lain: ${nasabah.peminjamanEksternal.length} pinjaman`);
        }

        // Behavior check
        const behaviorRisks = await this.detectRiskyBehavior(nasabahId);
        if (behaviorRisks.length > 0) {
            if (status === 'APPROVED') status = 'REVIEW';
            reasons.push(`Indikasi perilaku berisiko: ${behaviorRisks.join(', ')}`);
        }

        return {
            nasabahId,
            namaLengkap: nasabah.nama,
            penghasilan: nasabah.penghasilan,
            nilaiPinjamanProposal: proposedLoanAmount,
            tenor: tenor,
            cicilanBulanProposal: Math.round(cicilanBulanan * 100) / 100,
            totalBungaProposal: Math.round(totalBunga * 100) / 100,
            totalPembayaranProposal: Math.round(totalPembayaran * 100) / 100,
            rasioSebelum: Math.round(rasioSebelum * 100) / 100,
            rasioSesudah: Math.round(rasioSesudah * 100) / 100,
            riwayatPembayaran: {
                totalPembayaran,
                telat: latePayments,
                persentaseTelat: Math.round(delinquency * 100) / 100,
            },
            biChecking: {
                statusBI: biChecking.statusBI,
                totalPinjamanAktif: biChecking.totalPinjamanAktif,
                pernahMacet: biChecking.pernahMacet,
            },
            peminjamanEksternal: nasabah.peminjamanEksternal.length,
            status,
            reasons: reasons.length > 0 ? reasons : ['Semua kriteria terpenuhi'],
            recommendation: status === 'APPROVED' ? 'Direkomendasikan untuk persetujuan' : status === 'REVIEW' ? 'Perlu review lebih lanjut' : 'Tidak direkomendasikan',
        };
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

        if (!nasabah) throw new NotFoundException('Nasabah tidak ditemukan');

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
     * Analyze loan frequency pattern (berapa kali pinjam dalam periode tertentu)
     */
    async analyzeLoanFrequency(nasabahId: number, periodMonths: number = 3) {
        const nasabah = await this.prisma.nasabah.findUnique({
            where: { id: nasabahId },
            include: { pinjaman: true },
        });

        if (!nasabah) throw new NotFoundException('Nasabah tidak ditemukan');

        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - periodMonths);

        const loansInPeriod = nasabah.pinjaman.filter((p) => new Date(p.createdAt) > cutoffDate);
        const averageLoansPerMonth = loansInPeriod.length / periodMonths;

        return {
            nasabahId,
            period: `${periodMonths} bulan terakhir`,
            totalLoans: loansInPeriod.length,
            averageLoansPerMonth: Math.round(averageLoansPerMonth * 100) / 100,
            riskLevel: averageLoansPerMonth >= 2 ? 'TINGGI' : averageLoansPerMonth >= 1 ? 'SEDANG' : 'RENDAH',
            loansDetail: loansInPeriod.map((l) => ({
                id: l.id,
                amount: l.jumlahPinjaman,
                tenor: l.tenor,
                createdAt: l.createdAt,
            })),
        };
    }

    /**
     * Analyze delinquency pattern (pola keterlambatan pembayaran)
     */
    async analyzeDelinquencyPattern(nasabahId: number) {
        const nasabah = await this.prisma.nasabah.findUnique({
            where: { id: nasabahId },
            include: {
                pinjaman: {
                    include: {
                        pembayaran: {
                            orderBy: { createdAt: 'asc' },
                        },
                    },
                },
            },
        });

        if (!nasabah) throw new NotFoundException('Nasabah tidak ditemukan');

        let totalPayments = 0;
        let latePayments = 0;
        let consecutiveLateDays: number[] = [];
        let currentStreak = 0;
        const delinquencyMonths: string[] = [];

        for (const pinjaman of nasabah.pinjaman) {
            for (const pembayaran of pinjaman.pembayaran) {
                totalPayments++;

                if (pembayaran.statusBayar === 'telat') {
                    latePayments++;
                    currentStreak++;

                    if (pembayaran.dariTanggalSeharusnya) {
                        const daysLate = Math.floor(
                            (new Date(pembayaran.tanggalBayar).getTime() -
                                new Date(pembayaran.dariTanggalSeharusnya).getTime()) /
                            (1000 * 60 * 60 * 24),
                        );
                        consecutiveLateDays.push(daysLate);
                        delinquencyMonths.push(new Date(pembayaran.tanggalBayar).toISOString().slice(0, 7));
                    }
                } else {
                    if (currentStreak > 0) {
                        currentStreak = 0;
                    }
                }
            }
        }

        const maxConsecutiveLate = Math.max(...consecutiveLateDays, 0);
        const avgDaysLate = consecutiveLateDays.length > 0
            ? Math.round((consecutiveLateDays.reduce((a, b) => a + b, 0) / consecutiveLateDays.length) * 100) / 100
            : 0;

        return {
            nasabahId,
            totalPayments,
            latePayments,
            persentaseLate: Math.round((latePayments / totalPayments) * 100 * 100) / 100,
            maxConsecutiveLateDays: maxConsecutiveLate,
            averageDaysLate: avgDaysLate,
            delinquencyMonths: [...new Set(delinquencyMonths)],
            riskLevel: maxConsecutiveLate > 30 ? 'TINGGI' : maxConsecutiveLate > 10 ? 'SEDANG' : 'RENDAH',
        };
    }

    /**
     * Calculate comprehensive behavior risk score
     */
    async calculateBehaviorRiskScore(nasabahId: number): Promise<number> {
        let behaviorScore = 0;

        try {
            // Loan frequency (max 30 points)
            const frequency = await this.analyzeLoanFrequency(nasabahId, 3);
            if (frequency.riskLevel === 'TINGGI') behaviorScore += 30;
            else if (frequency.riskLevel === 'SEDANG') behaviorScore += 15;

            // Delinquency pattern (max 40 points)
            const delinquency = await this.analyzeDelinquencyPattern(nasabahId);
            if (delinquency.riskLevel === 'TINGGI') behaviorScore += 40;
            else if (delinquency.riskLevel === 'SEDANG') behaviorScore += 20;

            // Risky behavior indicators (max 30 points)
            const indicators = await this.detectRiskyBehavior(nasabahId);
            if (indicators.length > 0) {
                behaviorScore += Math.min(indicators.length * 10, 30);
            }

            return Math.min(behaviorScore, 100);
        } catch {
            return 0;
        }
    }

    /**
     * Get comprehensive behavior risk analysis
     */
    async getBehaviorRiskAnalysis(nasabahId: number) {
        const frequency = await this.analyzeLoanFrequency(nasabahId, 3);
        const delinquency = await this.analyzeDelinquencyPattern(nasabahId);
        const indicators = await this.detectRiskyBehavior(nasabahId);
        const behaviorScore = await this.calculateBehaviorRiskScore(nasabahId);

        const overallRisk =
            behaviorScore > 70 ? 'TINGGI' : behaviorScore > 40 ? 'SEDANG' : 'RENDAH';

        return {
            nasabahId,
            behaviorRiskScore: behaviorScore,
            overallRiskLevel: overallRisk,
            loanFrequency: frequency,
            delinquencyPattern: delinquency,
            riskIndicators: indicators,
            recommendation:
                overallRisk === 'TINGGI'
                    ? 'Nasabah menunjukkan pola berisiko tinggi. Pertimbangkan untuk menolak atau melakukan review mendalam.'
                    : overallRisk === 'SEDANG'
                        ? 'Nasabah menunjukkan beberapa indikasi perilaku berisiko. Lakukan monitoring lebih ketat.'
                        : 'Perilaku nasabah tergolong normal.',
        };
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

    /**
     * Get detailed dashboard with all analytics
     */
    async getDetailedDashboardData() {
        const overview = await this.getDashboardData();

        // Get top risk customers
        const topRiskCustomers = await this.prisma.risikoNasabah.findMany({
            where: { kategoriRisiko: 'tinggi' },
            orderBy: { skorRisiko: 'desc' },
            take: 5,
            include: { nasabah: { select: { id: true, nama: true, pekerjaan: true } } },
        });

        // Get nasabah by job type
        const nasabahByJob = await this.prisma.nasabah.groupBy({
            by: ['pekerjaan'],
            _count: true,
        });

        // Get active vs completed loans
        const loansStatus = await this.prisma.pinjaman.groupBy({
            by: ['status'],
            _count: true,
        });

        return {
            overview,
            topRiskCustomers: topRiskCustomers.map((r) => ({
                nasabahId: r.nasabahId,
                nama: r.nasabah.nama,
                pekerjaan: r.nasabah.pekerjaan,
                skorRisiko: r.skorRisiko,
                kategoriRisiko: r.kategoriRisiko,
                rekomendasi: r.rekomendasi,
            })),
            nasabahByJob,
            loansStatus,
        };
    }

    /**
     * Get jobs analysis dashboard
     */
    async getJobsAnalysisDashboard() {
        const jobs = await this.prisma.nasabah.findMany({
            distinct: ['pekerjaan'],
            select: { pekerjaan: true },
        });

        const jobsAnalysis: any[] = [];

        for (const job of jobs) {
            const nasabahList = await this.prisma.nasabah.findMany({
                where: { pekerjaan: job.pekerjaan },
                include: {
                    pinjaman: {
                        include: { pembayaran: true },
                    },
                    risikoNasabah: true,
                },
            });

            let totalNasabah = 0;
            let nasabahTelat = 0;
            let nasabahLancar = 0;
            let risikoTinggi = 0;
            let totalPenghasilan = 0;

            for (const nasabah of nasabahList) {
                totalNasabah++;
                totalPenghasilan += nasabah.penghasilan;

                const delinquency = await this.pembayaranService.getDelinquencyPercentage(nasabah.id);
                if (delinquency > 0) nasabahTelat++;
                else nasabahLancar++;

                if (nasabah.risikoNasabah?.kategoriRisiko === 'tinggi') risikoTinggi++;
            }

            jobsAnalysis.push({
                pekerjaan: job.pekerjaan,
                totalNasabah,
                nasabahTelat,
                nasabahLancar,
                rataRataPenghasilan: Math.round(totalPenghasilan / totalNasabah),
                persentaseKeterlambatan: totalNasabah > 0 ? Math.round((nasabahTelat / totalNasabah) * 100 * 100) / 100 : 0,
                risikoTinggi,
            });
        }

        return {
            totalJenisJob: jobsAnalysis.length,
            jobsAnalysis: jobsAnalysis.sort((a, b) => b.persentaseKeterlambatan - a.persentaseKeterlambatan),
        };
    }

    /**
     * Get risk summary
     */
    async getRiskSummary() {
        const risikoNasabah = await this.prisma.risikoNasabah.findMany();
        const nasabahList = await this.prisma.nasabah.findMany({
            include: { pinjaman: true, peminjamanEksternal: true },
        });

        const rendah = risikoNasabah.filter((r) => r.kategoriRisiko === 'rendah').length;
        const sedang = risikoNasabah.filter((r) => r.kategoriRisiko === 'sedang').length;
        const tinggi = risikoNasabah.filter((r) => r.kategoriRisiko === 'tinggi').length;

        const nasabahDenganEksternal = nasabahList.filter((n) => n.peminjamanEksternal.length > 0).length;
        const nasabahMultiPinjam = nasabahList.filter((n) => n.pinjaman.filter((p) => p.status === 'active').length > 1).length;

        return {
            kategoriRisiko: {
                rendah,
                sedang,
                tinggi,
                total: rendah + sedang + tinggi,
            },
            persentaseRisiko: {
                rendah: Math.round((rendah / (rendah + sedang + tinggi)) * 100 * 100) / 100,
                sedang: Math.round((sedang / (rendah + sedang + tinggi)) * 100 * 100) / 100,
                tinggi: Math.round((tinggi / (rendah + sedang + tinggi)) * 100 * 100) / 100,
            },
            analisisLanjut: {
                nasabahDenganPinjamanEksternal: nasabahDenganEksternal,
                nasabahDenganMultiPinjamAktif: nasabahMultiPinjam,
            },
        };
    }
}
