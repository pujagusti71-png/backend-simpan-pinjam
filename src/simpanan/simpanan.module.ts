import { Module } from '@nestjs/common';
import { SimpananService } from './simpanan.service';
import { SimpananController } from './simpanan.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SimpananController],
    providers: [SimpananService],
    exports: [SimpananService],
})
export class SimpananModule { }
