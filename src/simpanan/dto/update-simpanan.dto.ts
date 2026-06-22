import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSimpananDto {
    @ApiPropertyOptional({ example: 100000, description: 'Jumlah setoran atau penarikan baru' })
    jumlahSetoran?: number;

    @ApiPropertyOptional({ example: 1.5, description: 'Persentase bunga simpanan dalam persen' })
    bungaSimpanan?: number;

    @ApiPropertyOptional({ example: 'efektif', enum: ['flat', 'efektif'], description: 'Jenis perhitungan bunga' })
    jenisInterest?: 'flat' | 'efektif';

    @ApiPropertyOptional({ example: 'aktif', description: 'Status simpanan' })
    status?: string;

    @ApiPropertyOptional({ example: 'Perubahan keterangan', description: 'Keterangan tambahan transaksi simpanan' })
    keterangan?: string;
}
