import { Module } from '@nestjs/common';
import { RiwayatKreditService } from './riwayat-kredit.service';
import { RiwayatKreditController } from './riwayat-kredit.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalisisRisikoModule } from '../analisis-risiko/analisis-risiko.module';

@Module({
    imports: [PrismaModule, AnalisisRisikoModule],
    controllers: [RiwayatKreditController],
    providers: [RiwayatKreditService],
    exports: [RiwayatKreditService],
})
export class RiwayatKreditModule { }
