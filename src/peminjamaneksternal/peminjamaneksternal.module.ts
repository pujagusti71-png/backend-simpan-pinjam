import { Module } from '@nestjs/common';
import { PeminjamanEksternalService } from './peminjamaneksternal.service';
import { PeminjamanEksternalController } from './peminjamaneksternal.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalisisRisikoModule } from '../analisis-risiko/analisis-risiko.module';

@Module({
    imports: [PrismaModule, AnalisisRisikoModule],
    controllers: [PeminjamanEksternalController],
    providers: [PeminjamanEksternalService],
    exports: [PeminjamanEksternalService],
})
export class PeminjamanEksternalModule { }
