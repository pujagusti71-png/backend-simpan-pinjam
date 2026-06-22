import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSimpananDto {
    @ApiProperty({ example: 1, description: 'ID nasabah yang melakukan simpanan' })
    nasabahId: number;

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
