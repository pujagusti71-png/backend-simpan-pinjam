import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AnalisisPekerjaanService } from './analisis-pekerjaan.service';
import { JwtAuthGuard } from '../auth/guards';

@Controller('analisis-pekerjaan')
@UseGuards(JwtAuthGuard)
export class AnalisisPekerjaanController {
    constructor(private readonly analisisService: AnalisisPekerjaanService) { }

    /**
     * Get analysis by job type (delinquency, avg income, avg ratio, etc.)
     * GET /analisis-pekerjaan
     */
    @Get()
    async getAnalisisByPekerjaan() {
        return this.analisisService.getAnalisisByPekerjaan();
    }

    /**
     * Get job types with high risk only
     * GET /analisis-pekerjaan/high-risk
     */
    @Get('high-risk')
    async getHighRiskJobs() {
        return this.analisisService.getHighRiskJobs();
    }

    /**
     * Get statistics for specific job type
     * GET /analisis-pekerjaan/statistik/:pekerjaan
     */
    @Get('statistik/:pekerjaan')
    async getStatistikPerPekerjaan(@Param('pekerjaan') pekerjaan: string) {
        return this.analisisService.getStatistikPerPekerjaan(pekerjaan);
    }

    /**
     * Update or create AnalisisPerPekerjaan records in database
     * POST /analisis-pekerjaan/update
     */
    @Post('update')
    async updateAnalisisPerPekerjaan() {
        return this.analisisService.updateAnalisisPerPekerjaan();
    }
}
