import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RisikoAnalisisService } from './risiko-analisis.service';

@ApiTags('Analisis Risiko')
@ApiBearerAuth('JWT')
@Controller('analisis-risiko')
export class RisikoAnalisisController {
    constructor(private readonly risikoAnalisisService: RisikoAnalisisService) {}

    @Post(':idNasabah')
    async createRiskAnalysis(@Param('idNasabah', ParseIntPipe) idNasabah: number) {
        return this.risikoAnalisisService.calculateAndSaveRiskAnalysis(idNasabah);
    }

    @Get('nasabah/:idNasabah')
    async getRiskAnalysisHistory(@Param('idNasabah', ParseIntPipe) idNasabah: number) {
        return this.risikoAnalisisService.getAnalisisHistory(idNasabah);
    }

    @Get()
    async getAllRiskAnalyses() {
        return this.risikoAnalisisService.getAllAnalisis();
    }
}
