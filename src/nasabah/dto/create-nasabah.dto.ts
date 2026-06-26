import { ApiProperty } from '@nestjs/swagger';

export class CreateNasabahDto {
    @ApiProperty({ example: 'Budi Santoso' })
    nama!: string;

    @ApiProperty({ example: '3204123456789012' })
    nik!: string;

    @ApiProperty({ required: false, example: '1990-05-15' })
    tanggalLahir?: Date;

    @ApiProperty({ example: 'PNS' })
    pekerjaan!: string; // PNS, Freelance, Petani, dll

    @ApiProperty({ example: 5000000 })
    penghasilan!: number; // Penghasilan per bulan

    @ApiProperty({ required: false, example: 2000000 })
    saldoRataRata?: number;

    @ApiProperty({ required: false, example: 1500000 })
    estimasiPengeluaran?: number;

    @ApiProperty({ required: false, example: 'lancar' })
    riwayatPembayaran?: string;

    @ApiProperty({ required: false, example: 2 })
    jumlahTanggungan?: number;
}
