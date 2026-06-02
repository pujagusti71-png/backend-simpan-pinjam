import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RisikoAnalisisService } from './risiko-analisis.service';
import { UpdateRiwayatKreditDto } from './dto/update-riwayat-kredit.dto';

@ApiBearerAuth('JWT')
@Controller('risiko-analisis')
export class RisikoAnalisisController {
    constructor(private readonly risikoAnalisisService: RisikoAnalisisService) { }

    @Post('calculate/:nasabahId')
    calculateRiskProfile(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.risikoAnalisisService.createOrUpdateRiskProfile(nasabahId);
    }

    @Get('nasabah/:nasabahId')
    getRiskAnalysis(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.risikoAnalisisService.getRiskAnalysis(nasabahId);
    }

    @Post('pre-loan-checking/:nasabahId')
    preLoadChecking(
        @Param('nasabahId', ParseIntPipe) nasabahId: number,
        @Body() body: { proposedLoanAmount: number; proposedTenor?: number },
    ) {
        return this.risikoAnalisisService.preLoadChecking(
            nasabahId,
            body.proposedLoanAmount,
            body.proposedTenor || 12,
        );
    }

    @Get('behavior-risk/:nasabahId')
    getBehaviorRiskAnalysis(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.risikoAnalisisService.getBehaviorRiskAnalysis(nasabahId);
    }

    @Get('loan-frequency/:nasabahId')
    analyzeLoanFrequency(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.risikoAnalisisService.analyzeLoanFrequency(nasabahId, 3);
    }

    @Get('delinquency-pattern/:nasabahId')
    analyzeDelinquencyPattern(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.risikoAnalisisService.analyzeDelinquencyPattern(nasabahId);
    }

    @Get('pekerjaan/:pekerjaan')
    getAnalysisByPekerjaan(@Param('pekerjaan') pekerjaan: string) {
        return this.risikoAnalisisService.getAnalysisByPekerjaan(pekerjaan);
    }

    @Get('analisis/all-job')
    getAllJobAnalysis() {
        return this.risikoAnalisisService.getAllJobAnalysis();
    }

    @Put('bi-checking/:nasabahId')
    updateBIChecking(
        @Param('nasabahId', ParseIntPipe) nasabahId: number,
        @Body() biCheckingDto: UpdateRiwayatKreditDto,
    ) {
        return this.risikoAnalisisService.updateBIChecking(
            nasabahId,
            biCheckingDto,
        );
    }

    @Get('dashboard/overview')
    getDashboardData() {
        return this.risikoAnalisisService.getDashboardData();
    }

    @Get('dashboard/detailed')
    async getDetailedDashboard() {
        return this.risikoAnalisisService.getDetailedDashboardData();
    }

    @Get('dashboard/jobs-analysis')
    async getJobsAnalysisDashboard() {
        return this.risikoAnalisisService.getJobsAnalysisDashboard();
    }

    @Get('dashboard/risk-summary')
    async getRiskSummary() {
        return this.risikoAnalisisService.getRiskSummary();
    }
}
