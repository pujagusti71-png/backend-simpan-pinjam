import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalisisPekerjaanService } from './analisis-pekerjaan.service';
import { AnalisisPerPekerjaanDto, RisikoPerPekerjaanResponse, StatistikPerPekerjaanResponseDto, UpdateAnalisisPerPekerjaanResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';

@Controller('analisis-pekerjaan')
@ApiTags('Analisis Per Pekerjaan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AnalisisPekerjaanController {
    constructor(private readonly analisisService: AnalisisPekerjaanService) { }

    /**
     * Get analysis by job type (delinquency, avg income, avg ratio, etc.)
     * GET /analisis-pekerjaan
     */
    @Get()
    @ApiOperation({ summary: 'Ambil analisis risiko per pekerjaan' })
    @ApiResponse({ status: 200, description: 'Hasil analisis per pekerjaan', type: RisikoPerPekerjaanResponse })
    async getAnalisisByPekerjaan() {
        return this.analisisService.getAnalisisByPekerjaan();
    }

    /**
     * Get job types with high risk only
     * GET /analisis-pekerjaan/high-risk
     */
    @Get('high-risk')
    @ApiOperation({ summary: 'Ambil pekerjaan dengan risiko tinggi' })
    @ApiResponse({ status: 200, description: 'Daftar pekerjaan berisiko tinggi', type: [AnalisisPerPekerjaanDto] })
    async getHighRiskJobs() {
        return this.analisisService.getHighRiskJobs();
    }

    /**
     * Get statistics for specific job type
     * GET /analisis-pekerjaan/statistik/:pekerjaan
     */
    @Get('statistik/:pekerjaan')
    @ApiOperation({ summary: 'Ambil statistik untuk pekerjaan tertentu' })
    @ApiResponse({ status: 200, description: 'Statistik per pekerjaan', type: StatistikPerPekerjaanResponseDto })
    async getStatistikPerPekerjaan(@Param('pekerjaan') pekerjaan: string) {
        return this.analisisService.getStatistikPerPekerjaan(pekerjaan);
    }

    /**
     * Update or create AnalisisPerPekerjaan records in database
     * POST /analisis-pekerjaan/update
     */
    @Post('update')
    @ApiOperation({ summary: 'Perbarui atau buat ulang data analisis per pekerjaan' })
    @ApiResponse({ status: 200, description: 'Hasil update analisis per pekerjaan', type: UpdateAnalisisPerPekerjaanResponseDto })
    async updateAnalisisPerPekerjaan() {
        return this.analisisService.updateAnalisisPerPekerjaan();
    }
}
