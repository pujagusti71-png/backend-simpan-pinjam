import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiBody,
} from '@nestjs/swagger';
import { RisikoNasabahService } from './risiko-nasabah.service';
import { PreLoanCheckDto, RisikoNasabahResponseDto, BICheckingSummaryDto, PreLoanCheckResponseDto } from './dto/risiko-nasabah.dto';
import { JwtAuthGuard } from '../auth/guards';

@ApiTags('Risiko Nasabah')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('risiko-nasabah')
export class RisikoNasabahController {
    constructor(private readonly risikoService: RisikoNasabahService) {}

    /**
     * POST /risiko-nasabah/calculate/:nasabahId
     * Hitung skor risiko multi-faktor nasabah & simpan ke DB
     */
    @Post('calculate/:nasabahId')
    @ApiOperation({
        summary: 'Hitung risk score nasabah (multi-faktor)',
        description:
            'Menghitung skor risiko 0-100 dari: pekerjaan, rasio cicilan, riwayat bayar, SLIK, dan perilaku pinjaman. Hasil disimpan ke tabel RisikoNasabah.',
    })
    @ApiResponse({ status: 201, type: RisikoNasabahResponseDto })
    calculateRiskScore(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.risikoService.calculateRiskScore(nasabahId);
    }

    /**
     * GET /risiko-nasabah/:nasabahId
     * Ambil profil risiko nasabah dari DB (atau hitung ulang jika belum ada)
     */
    @Get(':nasabahId')
    @ApiOperation({
        summary: 'Ambil profil risiko nasabah',
        description: 'Mengembalikan data risiko terakhir dari DB. Jika belum ada, akan dihitung otomatis.',
    })
    @ApiResponse({ status: 200, type: RisikoNasabahResponseDto })
    getRisikoNasabah(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.risikoService.getRisikoNasabah(nasabahId);
    }

    /**
     * GET /risiko-nasabah/:nasabahId/keputusan
     * Decision Support System — rekomendasi akhir + penjelasan
     */
    @Get(':nasabahId/keputusan')
    @ApiOperation({
        summary: 'Decision Support System — rekomendasi Approve / Review / Reject',
        description:
            'Menghitung ulang skor terbaru dan memberikan rekomendasi keputusan beserta penjelasan detail untuk masing-masing faktor.',
    })
    getKeputusan(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.risikoService.getKeputusan(nasabahId);
    }

    /**
     * GET /risiko-nasabah/:nasabahId/rasio-cicilan
     * Rasio cicilan aktif terhadap penghasilan nasabah
     */
    @Get(':nasabahId/rasio-cicilan')
    @ApiOperation({
        summary: 'Hitung rasio cicilan nasabah (cicilan / penghasilan × 100%)',
        description: 'Menampilkan total cicilan pinjaman aktif dan persentasenya terhadap penghasilan.',
    })
    getRasioCicilan(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.risikoService.getRasioCicilan(nasabahId);
    }

    /**
     * GET /risiko-nasabah/:nasabahId/bi-checking
     * BI Checking / SLIK Summary
     */
    @Get(':nasabahId/bi-checking')
    @ApiOperation({
        summary: 'BI Checking / SLIK Summary',
        description:
            'Mengembalikan ringkasan status BI Checking nasabah: jumlah pinjaman eksternal aktif, kolektibilitas, status (aman/bermasalah), dan catatan riwayat macet.',
    })
    @ApiResponse({ status: 200, type: BICheckingSummaryDto })
    getBICheckingSummary(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.risikoService.getBICheckingSummary(nasabahId);
    }

    /**
     * POST /risiko-nasabah/pre-loan-check
     * Pre-Loan Checking — cek kelayakan sebelum pinjaman diproses
     */
    @Post('pre-loan-check')
    @ApiOperation({
        summary: 'Pre-Loan Checking — cek kelayakan sebelum pinjaman disetujui',
        description:
            'Menganalisis kemampuan nasabah membayar pinjaman baru berdasarkan penghasilan, cicilan saat ini, dan riwayat bayar. Mengembalikan status: layak / berisiko / ditolak.',
    })
    @ApiBody({ type: PreLoanCheckDto })
    @ApiResponse({ status: 201, type: PreLoanCheckResponseDto })
    preLoanCheck(@Body() dto: PreLoanCheckDto) {
        return this.risikoService.preLoanCheck(
            dto.nasabahId,
            dto.jumlahPinjaman,
            dto.tenor,
            dto.jenisBunga ?? 'flat',
        );
    }

    /**
     * GET /risiko-nasabah/laporan/semua
     * Laporan Analisis Risiko semua nasabah + ringkasan
     */
    @Get('laporan/semua')
    @ApiOperation({
        summary: 'Laporan analisis risiko semua nasabah',
        description:
            'Mengembalikan laporan lengkap semua nasabah yang sudah dihitung skor risikonya, beserta ringkasan (total approve/review/reject, breakdown kategori risiko).',
    })
    getLaporanRisikoSemua() {
        return this.risikoService.getLaporanRisikoSemua();
    }
}
