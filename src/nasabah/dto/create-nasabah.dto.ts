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

    @ApiProperty({ required: false, example: 'Jl. Merdeka No. 123, Jakarta' })
    alamat?: string;

    @ApiProperty({ required: false, example: '081234567890' })
    noHp?: string;

    @ApiProperty({ required: false, example: 'budi@email.com' })
    email?: string;

    @ApiProperty({ required: false, example: '123456789' })
    noRek?: string;

    @ApiProperty({ required: false, example: 'Siti Nurhaliza' })
    namaIbuKandung?: string;

    @ApiProperty({ required: false, example: 'Jl. Sudirman No. 45, Bandung' })
    alamatIbuKandung?: string;

    @ApiProperty({ required: false, example: '1965-03-20' })
    tanggalLahirIbuKandung?: Date;

    @ApiProperty({ required: false, example: 2000000 })
    saldoRataRata?: number;

    @ApiProperty({ required: false, example: 1500000 })
    estimasiPengeluaran?: number;
}
