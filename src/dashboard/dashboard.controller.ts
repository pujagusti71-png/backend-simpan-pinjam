import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('chart')
    @ApiOperation({ summary: 'Mengambil tren simpanan dan pinjaman enam bulan terakhir' })
    getChartData() {
        return this.dashboardService.getChartData();
    }
}