import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePinjamanDto {
    @ApiPropertyOptional({ example: 1, description: 'ID nasabah jika sudah ada' })
    nasabahId?: number;

    @ApiPropertyOptional({ example: 'Test User', description: 'Nama pemohon pinjaman' })
    nama?: string;

    @ApiPropertyOptional({ example: '1234567890123456', description: 'Nomor KTP pemohon' })
    nik?: string;

    @ApiPropertyOptional({ example: 'test@test.com', description: 'Email pemohon' })
    email?: string;

    @ApiPropertyOptional({ example: 5000000, description: 'Penghasilan bulanan pemohon' })
    penghasilan?: number;

    @ApiPropertyOptional({ example: 1000000, description: 'Jumlah cicilan yang sudah ada' })
    cicilan?: number;

    @ApiPropertyOptional({ example: 10000000, description: 'Jumlah pinjaman yang diajukan' })
    jumlah?: number;

    @ApiPropertyOptional({ example: '12', description: 'Tenor pinjaman dalam bulan' })
    tenor?: number | string;

    @ApiPropertyOptional({ example: '5', description: 'Bunga pinjaman dalam persen' })
    bunga?: number | string;

    @ApiPropertyOptional({ example: 'Modal usaha', description: 'Tujuan pemakaian pinjaman' })
    tujuan?: string;

    @ApiPropertyOptional({ example: 'Rendah', description: 'Skor risiko dari frontend' })
    risiko?: string;

    @ApiPropertyOptional({ example: 'Approve', description: 'Rekomendasi hasil analisis' })
    rekomendasi?: string;

    @ApiPropertyOptional({ example: 1000000, description: 'Jumlah pinjaman dalam satuan terkecil (mis. rupiah)' })
    jumlahPinjaman?: number;

    @ApiPropertyOptional({ example: 12, description: 'Tenor pinjaman dalam bulan' })
    tenorBulan?: number;

    @ApiPropertyOptional({ example: 5, description: 'Suku bunga dalam persen' })
    sukuBunga?: number;

    @ApiPropertyOptional({ example: 'flat', enum: ['flat', 'efektif'], description: 'Jenis perhitungan bunga' })
    jenisBunga?: 'flat' | 'efektif';
}
