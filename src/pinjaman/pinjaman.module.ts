import { Module } from '@nestjs/common';
import { PinjamanService } from './pinjaman.service';
import { PinjamanController } from './pinjaman.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PinjamanController],
    providers: [PinjamanService],
    exports: [PinjamanService],
})
export class PinjamanModule { }
