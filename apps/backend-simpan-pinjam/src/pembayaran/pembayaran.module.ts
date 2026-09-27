import { Module } from '@nestjs/common';
import { PembayaranService } from './pembayaran.service';
import { PembayaranController } from './pembayaran.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalisisRisikoModule } from '../analisis-risiko/analisis-risiko.module';

@Module({
    imports: [PrismaModule, AnalisisRisikoModule],
    controllers: [PembayaranController],
    providers: [PembayaranService],
    exports: [PembayaranService],
})
export class PembayaranModule { }
