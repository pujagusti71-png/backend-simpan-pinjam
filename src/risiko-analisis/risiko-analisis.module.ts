import { Module } from '@nestjs/common';
import { RisikoAnalisisService } from './risiko-analisis.service';
import { RisikoAnalisisController } from './risiko-analisis.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [RisikoAnalisisController],
    providers: [RisikoAnalisisService],
    exports: [RisikoAnalisisService],
})
export class RisikoAnalisisModule { }
