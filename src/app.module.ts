import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { NasabahModule } from './nasabah/nasabah.module';
import { PinjamanModule } from './pinjaman/pinjaman.module';
import { PembayaranModule } from './pembayaran/pembayaran.module';
import { RiwayatKreditModule } from './riwayat-kredit/riwayat-kredit.module';
import { PeminjamanEksternalModule } from './peminjamaneksternal/peminjamaneksternal.module';
import { SimpananModule } from './simpanan/simpanan.module';
import { AnalisisPekerjaanModule } from './analisis-pekerjaan/analisis-pekerjaan.module';
import { RisikoAnalisisModule } from './risiko-analisis/risiko-analisis.module';
import { JwtAuthGuard } from './auth/guards';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    NasabahModule,
    PinjamanModule,
    PembayaranModule,
    RiwayatKreditModule,
    PeminjamanEksternalModule,
    SimpananModule,
    AnalisisPekerjaanModule,
    RisikoAnalisisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
