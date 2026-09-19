import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PeminjamanEksternalService } from './peminjamaneksternal.service';
import { CreatePeminjamanEksternalDto } from './dto/create-peminjamaneksternal.dto';

@ApiBearerAuth('JWT')
@Controller('peminjamaneksternal')
export class PeminjamanEksternalController {
    constructor(
        private readonly peminjamanEksternalService: PeminjamanEksternalService,
    ) { }

    @Post()
    create(@Body() createPeminjamanEksternalDto: CreatePeminjamanEksternalDto) {
        return this.peminjamanEksternalService.create(createPeminjamanEksternalDto);
    }

    @Get()
    findAll() {
        return this.peminjamanEksternalService.findAll();
    }

    @Get('nasabah/:nasabahId')
    findByNasabah(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.peminjamanEksternalService.findByNasabah(nasabahId);
    }

    @Get('total/:nasabahId')
    getTotalExternalLoan(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.peminjamanEksternalService.getTotalExternalLoan(nasabahId);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.peminjamanEksternalService.remove(id);
    }
}
