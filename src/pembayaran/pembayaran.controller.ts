import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ParseIntPipe,
} from '@nestjs/common';
import { PembayaranService } from './pembayaran.service';
import { CreatePembayaranDto } from './dto/create-pembayaran.dto';

@Controller('pembayaran')
export class PembayaranController {
    constructor(private readonly pembayaranService: PembayaranService) { }

    @Post()
    create(@Body() createPembayaranDto: CreatePembayaranDto) {
        return this.pembayaranService.create(createPembayaranDto);
    }

    @Get()
    findAll() {
        return this.pembayaranService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.pembayaranService.findOne(id);
    }

    @Get('pinjaman/:pinjamanId')
    findByPinjaman(@Param('pinjamanId', ParseIntPipe) pinjamanId: number) {
        return this.pembayaranService.findByPinjaman(pinjamanId);
    }

    @Get('nasabah/:nasabahId')
    findByNasabah(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.pembayaranService.findByNasabah(nasabahId);
    }

    @Get('delinquency/:nasabahId')
    getDelinquencyPercentage(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.pembayaranService.getDelinquencyPercentage(nasabahId);
    }
}
