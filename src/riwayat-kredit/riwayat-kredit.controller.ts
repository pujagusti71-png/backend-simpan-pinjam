import {
    Controller,
    Post,
    Get,
    Put,
    Body,
    Param,
    ParseIntPipe,
} from '@nestjs/common';
import { RiwayatKreditService } from './riwayat-kredit.service';
import { CreateRiwayatKreditDto } from './dto/create-riwayat-kredit.dto';

@Controller('riwayat-kredit')
export class RiwayatKreditController {
    constructor(private readonly riwayatKreditService: RiwayatKreditService) { }

    @Post()
    create(@Body() createRiwayatKreditDto: CreateRiwayatKreditDto) {
        return this.riwayatKreditService.create(createRiwayatKreditDto);
    }

    @Get('nasabah/:nasabahId')
    findByNasabah(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.riwayatKreditService.findByNasabah(nasabahId);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateData: any) {
        return this.riwayatKreditService.update(id, updateData);
    }
}
