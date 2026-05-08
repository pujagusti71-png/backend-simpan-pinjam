import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    ParseIntPipe,
} from '@nestjs/common';
import { RisikoAnalisisService } from './risiko-analisis.service';
import { UpdateRiwayatKreditDto } from './dto/update-riwayat-kredit.dto';

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
}
