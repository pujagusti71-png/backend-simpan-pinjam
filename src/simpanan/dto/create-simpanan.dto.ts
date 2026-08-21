import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSimpananDto {
    @ApiProperty({ example: 1, description: 'ID nasabah yang melakukan simpanan' })
    nasabahId!: number;

    @ApiProperty({ example: 100000, description: 'Jumlah setoran yang dimasukkan' })
    jumlahSetoran!: number;


    @ApiPropertyOptional({ description: 'Tanggal setoran. Jika tidak diisi, server akan menggunakan waktu sekarang' })
    tanggalSetoran?: Date;

    @ApiPropertyOptional({ example: 'Setoran bulan Juni', description: 'Keterangan transaksi simpanan' })
    keterangan?: string;
}
