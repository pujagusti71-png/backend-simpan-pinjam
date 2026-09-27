import { Module } from '@nestjs/common';
import { PinjamanService } from './pinjaman.service';
import { PinjamanController } from './pinjaman.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalisisRisikoModule } from '../analisis-risiko/analisis-risiko.module';

@Module({
    imports: [PrismaModule, AnalisisRisikoModule],
    controllers: [PinjamanController],
    providers: [PinjamanService],
    exports: [PinjamanService],
})
export class PinjamanModule { }
