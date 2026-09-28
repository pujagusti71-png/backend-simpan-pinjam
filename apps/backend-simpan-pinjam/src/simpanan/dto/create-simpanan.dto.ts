import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSimpananDto {
    @ApiPropertyOptional({ example: 1, description: 'ID nasabah yang melakukan simpanan' })
    nasabahId?: number;

    @ApiPropertyOptional({ example: 'Budi Santoso', description: 'Nama nasabah baru' })
    nama?: string;

    @ApiPropertyOptional({ example: '3204120101900004', description: 'NIK nasabah baru' })
    nik?: string;

    @ApiPropertyOptional({ example: '1990-01-01', description: 'Tanggal lahir nasabah baru' })
    tanggalLahir?: Date;

    @ApiPropertyOptional({ example: 'Jl. Merdeka 1', description: 'Alamat nasabah baru' })
    alamat?: string;

    @ApiPropertyOptional({ example: 'Wiraswasta', description: 'Pekerjaan nasabah baru' })
    pekerjaan?: string;

    @ApiPropertyOptional({ example: 5000000, description: 'Penghasilan bulanan nasabah baru' })
    penghasilan?: number;

    @ApiProperty({ example: 100000, description: 'Jumlah setoran yang dimasukkan' })
    jumlahSetoran: number;

    @ApiPropertyOptional({ example: 1.5, description: 'Persentase bunga simpanan dalam persen' })
    bungaSimpanan?: number;

    @ApiPropertyOptional({ example: 'flat', enum: ['flat', 'efektif'], description: 'Jenis perhitungan bunga' })
    jenisInterest?: 'flat' | 'efektif';

    @ApiPropertyOptional({ example: '2026-06-03T08:00:00.000Z', description: 'Tanggal setoran' })
    tanggalSetoran?: Date;

    @ApiPropertyOptional({ example: 'Setoran bulan Juni', description: 'Keterangan transaksi simpanan' })
    keterangan?: string;
}
