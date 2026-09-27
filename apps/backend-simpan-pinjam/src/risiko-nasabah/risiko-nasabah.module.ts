import { Module } from '@nestjs/common';
import { RisikoNasabahService } from './risiko-nasabah.service';
import { RisikoNasabahController } from './risiko-nasabah.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [RisikoNasabahController],
    providers: [RisikoNasabahService],
    exports: [RisikoNasabahService],
})
export class RisikoNasabahModule {}
