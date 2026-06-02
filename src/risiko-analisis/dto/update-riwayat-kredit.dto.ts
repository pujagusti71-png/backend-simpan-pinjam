import { ApiProperty } from '@nestjs/swagger';

export class UpdateRiwayatKreditDto {
    @ApiProperty({ required: false, example: 2000000, description: 'Total pinjaman aktif' })
    totalPinjamanAktif?: number;

    @ApiProperty({ required: false, example: 'aman', enum: ['aman', 'bermasalah'], description: 'Status BI' })
    statusBI?: 'aman' | 'bermasalah';

    @ApiProperty({ required: false, example: 'kolektibilitas B', description: 'Kolektibilitas' })
    kolektibilitas?: string;

    @ApiProperty({ required: false, example: false, description: 'Pernah macet atau tidak' })
    pernahMacet?: boolean;
}
