import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    Query,
    DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NasabahService } from './nasabah.service';
import { CreateNasabahDto } from './dto/create-nasabah.dto';
import { UpdateNasabahDto } from './dto/update-nasabah.dto';

@ApiTags('Nasabah')
@ApiBearerAuth('JWT')
@Controller('nasabah')
export class NasabahController {
    constructor(private readonly nasabahService: NasabahService) { }

    @Post()
    create(@Body() createNasabahDto: CreateNasabahDto) {
        return this.nasabahService.create(createNasabahDto);
    }

    @Get()
    findAll() {
        return this.nasabahService.findAll();
    }

    @Get('nik/:nik')
    findByNIK(@Param('nik') nik: string) {
        return this.nasabahService.findByNIK(nik);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.nasabahService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateNasabahDto: UpdateNasabahDto,
    ) {
        return this.nasabahService.update(id, updateNasabahDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.nasabahService.remove(id);
    }

    @Get('pekerjaan/:pekerjaan')
    getAllByPekerjaan(@Param('pekerjaan') pekerjaan: string) {
        return this.nasabahService.getAllByPekerjaan(pekerjaan);
    }
}
