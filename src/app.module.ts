import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { NasabahModule } from './nasabah/nasabah.module';
import { PinjamanModule } from './pinjaman/pinjaman.module';
import { PembayaranModule } from './pembayaran/pembayaran.module';
import { RiwayatKreditModule } from './riwayat-kredit/riwayat-kredit.module';
import { PeminjamanEksternalModule } from './peminjamaneksternal/peminjamaneksternal.module';
import { RisikoAnalisisModule } from './risiko-analisis/risiko-analisis.module';

@Module({
  imports: [
    PrismaModule,
    NasabahModule,
    PinjamanModule,
    PembayaranModule,
    RiwayatKreditModule,
    PeminjamanEksternalModule,
    RisikoAnalisisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
