import { Module } from '@nestjs/common';
import { RisikoAnalisisService } from './risiko-analisis.service';
import { RisikoAnalisisController } from './risiko-analisis.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PembayaranModule } from '../pembayaran/pembayaran.module';
import { PinjamanModule } from '../pinjaman/pinjaman.module';

@Module({
    imports: [PrismaModule, PembayaranModule, PinjamanModule],
    controllers: [RisikoAnalisisController],
    providers: [RisikoAnalisisService],
    exports: [RisikoAnalisisService],
})
export class RisikoAnalisisModule { }
