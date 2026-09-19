import { ApiProperty } from '@nestjs/swagger';

export class CreateRiwayatKreditDto {
    @ApiProperty({ example: 1, description: 'ID nasabah' })
    nasabahId: number;

    @ApiProperty({ example: 2_000_000, description: 'Total pinjaman aktif nasabah' })
    totalPinjamanAktif: number;

    @ApiProperty({ example: 'aman', enum: ['aman', 'bermasalah'], description: 'Status di BI' })
    statusBI: 'aman' | 'bermasalah';

    @ApiProperty({ example: 'kolektibilitas A', description: 'Keterangan kolektibilitas' })
    kolektibilitas: string;

    @ApiProperty({ example: false, description: 'Apakah nasabah pernah macet' })
    pernahMacet: boolean;
}
