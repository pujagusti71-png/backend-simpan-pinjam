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
import { ApiTags, ApiBody, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PinjamanService } from './pinjaman.service';
import { CreatePinjamanDto } from './dto/create-pinjaman.dto';
import { UpdatePinjamanDto } from './dto/update-pinjaman.dto';
import { PinjamanResponseDto } from './dto/pinjaman-response.dto';

@ApiTags('pinjaman')
@ApiBearerAuth('JWT')
@Controller('pinjaman')
export class PinjamanController {
    constructor(private readonly pinjamanService: PinjamanService) { }

    @Post()
    @ApiOperation({ summary: 'Buat pinjaman baru' })
    @ApiBody({ type: CreatePinjamanDto })
    @ApiResponse({ status: 201, description: 'Pinjaman berhasil dibuat.' })
    create(@Body() createPinjamanDto: CreatePinjamanDto) {
        return this.pinjamanService.create(createPinjamanDto);
    }

    @Get()
    @ApiResponse({ status: 200, description: 'Daftar pinjaman', type: [PinjamanResponseDto] })
    findAll() {
        return this.pinjamanService.findAll();
    }

    @Get(':id')
    @ApiResponse({ status: 200, description: 'Detail pinjaman', type: PinjamanResponseDto })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.pinjamanService.findOne(id);
    }

    @Get('nasabah/:nasabahId')
    @ApiResponse({ status: 200, description: 'Pinjaman berdasarkan nasabah', type: [PinjamanResponseDto] })
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
    @ApiResponse({ status: 200, description: 'Pinjaman aktif nasabah', type: [PinjamanResponseDto] })
    getActiveLoan(@Param('nasabahId', ParseIntPipe) nasabahId: number) {
        return this.pinjamanService.getActiveLoan(nasabahId);
    }
}
