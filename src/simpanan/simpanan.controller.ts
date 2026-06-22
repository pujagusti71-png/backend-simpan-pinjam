import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SimpananService } from './simpanan.service';
import {
    CreateSimpananDto,
    UpdateSimpananDto,
    ListSimpananDto,
    PaginatedSimpananResponse,
    WithdrawSimpananDto,
    CurrentBalanceDto,
    SimpananSummaryDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';

@Controller('simpanan')
@ApiTags('Simpanan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class SimpananController {
    constructor(private readonly simpananService: SimpananService) { }

    /**
     * Create new savings deposit
     * POST /simpanan
     */
    @Post()
    @ApiOperation({ summary: 'Buat transaksi simpanan baru' })
    @ApiBody({ type: CreateSimpananDto })
    @ApiResponse({ status: 201, description: 'Simpanan berhasil dibuat', type: ListSimpananDto })
    async create(@Body() createSimpananDto: CreateSimpananDto) {
        return this.simpananService.create(createSimpananDto);
    }

    /**
     * Get savings history for a customer (paginated)
     * GET /simpanan/nasabah/:nasabahId
     */
    @Get('nasabah/:nasabahId')
    @ApiOperation({ summary: 'Ambil riwayat simpanan nasabah secara paginasi' })
    @ApiResponse({ status: 200, description: 'Daftar simpanan nasabah', type: PaginatedSimpananResponse })
    async findByNasabah(
        @Param('nasabahId') nasabahId: string,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ) {
        return this.simpananService.findAllPaginated(
            parseInt(nasabahId),
            parseInt(page),
            parseInt(limit),
        );
    }

    /**
     * Get current balance for a customer
     * GET /simpanan/saldo/:nasabahId
     */
    @Get('saldo/:nasabahId')
    @ApiOperation({ summary: 'Ambil saldo saat ini untuk nasabah' })
    @ApiResponse({ status: 200, description: 'Saldo nasabah saat ini', type: CurrentBalanceDto })
    async getBalance(@Param('nasabahId') nasabahId: string) {
        const balance = await this.simpananService.getCurrentBalance(parseInt(nasabahId));
        return { saldoSaatIni: balance };
    }

    /**
     * Get savings summary for a customer
     * GET /simpanan/summary/:nasabahId
     */
    @Get('summary/:nasabahId')
    @ApiOperation({ summary: 'Ambil ringkasan simpanan nasabah' })
    @ApiResponse({ status: 200, description: 'Ringkasan simpanan nasabah', type: SimpananSummaryDto })
    async getSummary(@Param('nasabahId') nasabahId: string) {
        return this.simpananService.getSimpananSummary(parseInt(nasabahId));
    }

    /**
     * Withdraw savings
     * POST /simpanan/withdraw
     */
    @Post('withdraw')
    @ApiOperation({ summary: 'Lakukan penarikan simpanan' })
    @ApiBody({ type: WithdrawSimpananDto })
    @ApiResponse({ status: 201, description: 'Penarikan berhasil dicatat', type: ListSimpananDto })
    async withdraw(
        @Body() body: WithdrawSimpananDto,
    ) {
        return this.simpananService.withdraw(
            body.nasabahId,
            body.jumlahPenarikan,
            body.keterangan,
        );
    }

    /**
     * Apply interest to savings
     * POST /simpanan/apply-interest/:nasabahId
     */
    @Post('apply-interest/:nasabahId')
    @ApiOperation({ summary: 'Terapkan bunga simpanan untuk nasabah' })
    @ApiResponse({ status: 201, description: 'Bunga telah ditambahkan', type: ListSimpananDto })
    async applyInterest(@Param('nasabahId') nasabahId: string) {
        return this.simpananService.applyInterest(parseInt(nasabahId));
    }

    /**
     * Get one savings record
     * GET /simpanan/:id
     */
    @Get(':id')
    @ApiOperation({ summary: 'Ambil detail transaksi simpanan berdasarkan ID' })
    @ApiResponse({ status: 200, description: 'Detail simpanan', type: ListSimpananDto })
    async findOne(@Param('id') id: string) {
        return this.simpananService.findOne(parseInt(id));
    }

    /**
     * Update savings record
     * PUT /simpanan/:id
     */
    @Put(':id')
    @ApiOperation({ summary: 'Perbarui transaksi simpanan' })
    @ApiBody({ type: UpdateSimpananDto })
    @ApiResponse({ status: 200, description: 'Simpanan berhasil diperbarui', type: ListSimpananDto })
    async update(
        @Param('id') id: string,
        @Body() updateSimpananDto: UpdateSimpananDto,
    ) {
        return this.simpananService.update(parseInt(id), updateSimpananDto);
    }

    /**
     * Delete savings record
     * DELETE /simpanan/:id
     */
    @Delete(':id')
    @ApiOperation({ summary: 'Hapus transaksi simpanan berdasarkan ID' })
    @ApiResponse({ status: 200, description: 'Simpanan berhasil dihapus', type: ListSimpananDto })
    async delete(@Param('id') id: string) {
        return this.simpananService.delete(parseInt(id));
    }
}
