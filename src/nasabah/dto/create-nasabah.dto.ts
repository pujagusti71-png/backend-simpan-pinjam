import { ApiProperty } from '@nestjs/swagger';

export class CreateNasabahDto {
    @ApiProperty({ example: 'Budi Santoso' })
    nama!: string;

    @ApiProperty({ example: '3204123456789012' })
    nik!: string;

    @ApiProperty({ example: 'PNS' })
    pekerjaan!: string; // PNS, Freelance, Petani, dll

    @ApiProperty({ example: 5000000 })
    penghasilan!: number; // Penghasilan per bulan

    @ApiProperty({ required: false, example: 2000000 })
    saldoRataRata?: number;

    @ApiProperty({ required: false, example: 1500000 })
    estimasiPengeluaran?: number;
}
