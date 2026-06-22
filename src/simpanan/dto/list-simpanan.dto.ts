import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ListSimpananDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 1 })
    nasabahId: number;

    @ApiProperty({ example: 100000 })
    jumlahSetoran: number;

    @ApiPropertyOptional({ example: 1.5 })
    bungaSimpanan?: number;

    @ApiPropertyOptional({ example: 'flat' })
    jenisInterest?: string;

    @ApiProperty({ example: '2026-06-03T08:00:00.000Z' })
    tanggalSetoran: Date;

    @ApiProperty({ example: 110000 })
    saldoAkhir: number;

    @ApiProperty({ example: 'aktif' })
    status: string;

    @ApiPropertyOptional({ example: 'Setoran awal' })
    keterangan?: string;

    @ApiProperty({ example: '2026-06-03T08:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-06-03T08:00:00.000Z' })
    updatedAt: Date;
}

export class PaginatedSimpananResponse {
    @ApiProperty({ type: [ListSimpananDto] })
    data: ListSimpananDto[];

    @ApiProperty({ example: 100 })
    total: number;

    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 10 })
    limit: number;

    @ApiProperty({ example: 10 })
    totalPages: number;

    @ApiProperty({ example: true })
    hasNextPage: boolean;

    @ApiProperty({ example: false })
    hasPrevPage: boolean;
}
