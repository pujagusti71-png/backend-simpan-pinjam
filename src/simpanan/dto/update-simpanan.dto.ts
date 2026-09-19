import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSimpananDto {
    @ApiPropertyOptional({ example: 100000, description: 'Jumlah setoran atau penarikan baru' })
    jumlahSetoran?: number;


    @ApiPropertyOptional({ example: 'aktif', description: 'Status simpanan' })
    status?: string;

    @ApiPropertyOptional({ example: 'Perubahan keterangan', description: 'Keterangan tambahan transaksi simpanan' })
    keterangan?: string;
}
