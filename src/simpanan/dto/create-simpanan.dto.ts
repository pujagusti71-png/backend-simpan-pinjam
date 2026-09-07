import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSimpananDto {
    @ApiProperty({ example: 1, description: 'ID nasabah yang melakukan simpanan. Jika tidak diisi, sistem akan membuat nasabah baru.', required: false })
    nasabahId?: number;

    @ApiPropertyOptional({ example: 'Budi Santoso', description: 'Nama nasabah baru jika ID tidak tersedia' })
    nama?: string;

    @ApiPropertyOptional({ example: '3204123456789012', description: 'NIK nasabah baru jika ID tidak tersedia' })
    nik?: string;

    @ApiPropertyOptional({ example: 'Jl. Merdeka No. 10', description: 'Alamat nasabah baru jika ID tidak tersedia' })
    alamat?: string;

    @ApiPropertyOptional({ example: '1990-05-15', description: 'Tanggal lahir nasabah baru jika ID tidak tersedia' })
    tanggalLahir?: string | Date;

    @ApiPropertyOptional({ example: 'PNS', description: 'Pekerjaan nasabah baru jika ID tidak tersedia' })
    pekerjaan?: string;

    @ApiPropertyOptional({ example: 5000000, description: 'Penghasilan nasabah baru jika ID tidak tersedia' })
    penghasilan?: number;

    @ApiProperty({ example: 100000, description: 'Jumlah setoran yang dimasukkan' })
    jumlahSetoran!: number;

    @ApiPropertyOptional({ description: 'Tanggal setoran. Jika tidak diisi, server akan menggunakan waktu sekarang' })
    tanggalSetoran?: Date;

    @ApiPropertyOptional({ example: 'Setoran bulan Juni', description: 'Keterangan transaksi simpanan' })
    keterangan?: string;
}
