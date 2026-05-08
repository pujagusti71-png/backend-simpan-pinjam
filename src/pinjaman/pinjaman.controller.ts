import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
} from '@nestjs/common';
import { PinjamanService } from './pinjaman.service';
import { CreatePinjamanDto } from './dto/create-pinjaman.dto';
import { UpdatePinjamanDto } from './dto/update-pinjaman.dto';

@Controller('pinjaman')
export class PinjamanController {
    constructor(private readonly pinjamanService: PinjamanService) { }

    @Post()
    create(@Body() createPinjamanDto: CreatePinjamanDto) {
        return this.pinjamanService.create(createPinjamanDto);
    }

    @Get()
    findAll() {
        return this.pinjamanService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.pinjamanService.findOne(id);
    }

    @Get('nasabah/:nasabahId')
    findByNasabah(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.pinjamanService.findByNasabah(nasabahId);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updatePinjamanDto: UpdatePinjamanDto,
    ) {
        return this.pinjamanService.update(id, updatePinjamanDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.pinjamanService.remove(id);
    }

    @Get('active/:nasabahId')
    getActiveLoan(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.pinjamanService.getActiveLoan(nasabahId);
    }
}
