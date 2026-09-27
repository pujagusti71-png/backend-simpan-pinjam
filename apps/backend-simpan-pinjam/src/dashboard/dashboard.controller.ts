import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('chart')
    @ApiOperation({ summary: 'Tren simpanan dan pinjaman enam bulan terakhir' })
    getChartData() {
        return this.dashboardService.getChartData();
    }

    @Get('delinquency-trend')
    @ApiOperation({ summary: 'Mengambil tren keterlambatan pembayaran (%) enam bulan terakhir' })
    getDelinquencyTrend() {
        return this.dashboardService.getDelinquencyTrend();
    }

    @Get('summary')
    @ApiOperation({
        summary: 'Ringkasan statistik utama dashboard monitoring',
        description: 'Menampilkan total nasabah, pinjaman aktif, nasabah telat, breakdown risiko, dan breakdown keputusan approve/review/reject.',
    })
    getDashboardSummary() {
        return this.dashboardService.getDashboardSummary();
    }

    @Get('laporan')
    @ApiOperation({
        summary: 'Laporan analisis risiko lengkap per nasabah',
        description: 'Mengembalikan laporan komprehensif setiap nasabah: rasio cicilan, riwayat pembayaran, kategori risiko, dan rekomendasi, beserta ringkasan total.',
    })
    getLaporan() {
        return this.dashboardService.getLaporan();
    }
}