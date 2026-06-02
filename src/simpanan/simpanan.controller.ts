import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { SimpananService } from './simpanan.service';
import { CreateSimpananDto, UpdateSimpananDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';

@Controller('simpanan')
@UseGuards(JwtAuthGuard)
export class SimpananController {
    constructor(private readonly simpananService: SimpananService) { }

    /**
     * Create new savings deposit
     * POST /simpanan
     */
    @Post()
    async create(@Body() createSimpananDto: CreateSimpananDto) {
        return this.simpananService.create(createSimpananDto);
    }

    /**
     * Get savings history for a customer (paginated)
     * GET /simpanan/nasabah/:nasabahId
     */
    @Get('nasabah/:nasabahId')
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
    async getBalance(@Param('nasabahId') nasabahId: string) {
        const balance = await this.simpananService.getCurrentBalance(parseInt(nasabahId));
        return { saldoSaatIni: balance };
    }

    /**
     * Get savings summary for a customer
     * GET /simpanan/summary/:nasabahId
     */
    @Get('summary/:nasabahId')
    async getSummary(@Param('nasabahId') nasabahId: string) {
        return this.simpananService.getSimpananSummary(parseInt(nasabahId));
    }

    /**
     * Withdraw savings
     * POST /simpanan/withdraw
     */
    @Post('withdraw')
    async withdraw(
        @Body() body: { nasabahId: number; jumlahPenarikan: number; keterangan?: string },
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
    async applyInterest(@Param('nasabahId') nasabahId: string) {
        return this.simpananService.applyInterest(parseInt(nasabahId));
    }

    /**
     * Get one savings record
     * GET /simpanan/:id
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.simpananService.findOne(parseInt(id));
    }

    /**
     * Update savings record
     * PUT /simpanan/:id
     */
    @Put(':id')
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
    async delete(@Param('id') id: string) {
        return this.simpananService.delete(parseInt(id));
    }
}
