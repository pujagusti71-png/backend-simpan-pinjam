import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WithdrawSimpananDto {
    @ApiProperty({ example: 1, description: 'ID nasabah yang melakukan penarikan' })
    nasabahId: number;

    @ApiProperty({ example: 50000, description: 'Jumlah penarikan yang diminta' })
    jumlahPenarikan: number;

    @ApiPropertyOptional({ example: 'Tarik tunai', description: 'Keterangan penarikan' })
    keterangan?: string;
}
