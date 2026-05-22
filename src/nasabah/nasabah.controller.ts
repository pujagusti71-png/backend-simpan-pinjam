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
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by nama or nik' })
    @ApiQuery({ name: 'pekerjaan', required: false, type: String, description: 'Filter by pekerjaan (job)' })
    findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('search') search?: string,
        @Query('pekerjaan') pekerjaan?: string,
    ) {
        // Cap limit at 100 for performance
        const limitCapped = Math.min(Math.max(limit, 1), 100);
        return this.nasabahService.findAllPaginated(page, limitCapped, search, pekerjaan);
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
