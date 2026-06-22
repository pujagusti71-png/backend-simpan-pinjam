import { ApiProperty } from '@nestjs/swagger';

export class SimpananSummaryDto {
    @ApiProperty({ example: 1 })
    nasabahId: number;

    @ApiProperty({ example: 'Budi' })
    namaLengkap: string;

    @ApiProperty({ example: 120000 })
    saldoSaatIni: number;

    @ApiProperty({ example: 200000 })
    totalSetoran: number;

    @ApiProperty({ example: 50000 })
    totalPenarikan: number;

    @ApiProperty({ example: 15000 })
    totalBungaTerkumpul: number;

    @ApiProperty({ example: 3 })
    jumlahTransaksi: number;
}
