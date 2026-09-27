import { Module } from '@nestjs/common';
import { AnalisisRisikoService } from './analisis-risiko.service';
import { AnalisisRisikoController } from './analisis-risiko.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AnalisisRisikoController],
    providers: [AnalisisRisikoService],
    exports: [AnalisisRisikoService],
})
export class AnalisisRisikoModule { }
