import { Module } from '@nestjs/common';
import { AnalisisPekerjaanService } from './analisis-pekerjaan.service';
import { AnalisisPekerjaanController } from './analisis-pekerjaan.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AnalisisPekerjaanController],
    providers: [AnalisisPekerjaanService],
    exports: [AnalisisPekerjaanService],
})
export class AnalisisPekerjaanModule { }
