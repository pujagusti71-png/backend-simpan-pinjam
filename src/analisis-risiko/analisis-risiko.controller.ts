import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalisisRisikoService } from './analisis-risiko.service';

@Controller('analisis-risiko')
@ApiTags('Analisis & Skor Risiko')
@ApiBearerAuth('JWT')
export class AnalisisRisikoController {
    constructor(private readonly analisisRisikoService: AnalisisRisikoService) { }

    /**
     * GET /analisis-risiko
     * Daftar skor risiko + rekomendasi keputusan (approve/review/reject)
     * untuk seluruh nasabah.
     */
    @Get()
    @ApiOperation({ summary: 'Ambil skor risiko & rekomendasi keputusan seluruh nasabah' })
    @ApiResponse({ status: 200, description: 'Daftar analisis & skor risiko nasabah' })
    findAll() {
        return this.analisisRisikoService.findAll();
    }

    /**
     * GET /analisis-risiko/nasabah/:nasabahId
     * Skor risiko satu nasabah (dihitung on-demand kalau belum ada).
     */
    @Get('nasabah/:nasabahId')
    @ApiOperation({ summary: 'Ambil / hitung skor risiko satu nasabah' })
    findByNasabah(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.analisisRisikoService.findByNasabah(nasabahId);
    }

    /**
     * POST /analisis-risiko/recompute/:nasabahId
     * Hitung ulang skor risiko satu nasabah (dipanggil manual dari UI, atau
     * otomatis setelah ada pinjaman/pembayaran/riwayat-kredit baru).
     */
    @Post('recompute/:nasabahId')
    @ApiOperation({ summary: 'Hitung ulang skor risiko satu nasabah' })
    recomputeForNasabah(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.analisisRisikoService.recomputeForNasabah(nasabahId);
    }

    /**
     * POST /analisis-risiko/recompute
     * Hitung ulang skor risiko seluruh nasabah sekaligus.
     */
    @Post('recompute')
    @ApiOperation({ summary: 'Hitung ulang skor risiko seluruh nasabah' })
    recomputeAll() {
        return this.analisisRisikoService.recomputeAll();
    }
}
