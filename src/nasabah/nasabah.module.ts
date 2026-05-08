import { Module } from '@nestjs/common';
import { NasabahService } from './nasabah.service';
import { NasabahController } from './nasabah.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [NasabahController],
    providers: [NasabahService],
    exports: [NasabahService],
})
export class NasabahModule { }
