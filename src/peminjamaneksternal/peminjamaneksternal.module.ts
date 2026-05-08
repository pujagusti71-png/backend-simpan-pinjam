import { Module } from '@nestjs/common';
import { PeminjamanEksternalService } from './peminjamaneksternal.service';
import { PeminjamanEksternalController } from './peminjamaneksternal.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PeminjamanEksternalController],
    providers: [PeminjamanEksternalService],
    exports: [PeminjamanEksternalService],
})
export class PeminjamanEksternalModule { }
