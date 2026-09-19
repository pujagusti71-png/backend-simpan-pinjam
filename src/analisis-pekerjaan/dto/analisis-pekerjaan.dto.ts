import { ApiProperty } from '@nestjs/swagger';

export class AnalisisPerPekerjaanDto {
    @ApiProperty({ example: 'Guru' })
    pekerjaan: string;

    @ApiProperty({ example: 100 })
    totalNasabah: number;

    @ApiProperty({ example: 25 })
    nasabahTelat: number;

    @ApiProperty({ example: 75 })
    nasabahLancar: number;

    @ApiProperty({ example: 12.5 })
    persentaseKeterlambatan: number;

    @ApiProperty({ example: 5000000 })
    rataRataPenghasilan: number;

    @ApiProperty({ example: 27.8 })
    rataRataRasioCikilan: number;

    @ApiProperty({ example: 'sedang', enum: ['rendah', 'sedang', 'tinggi'] })
    tingkatRisiko: 'rendah' | 'sedang' | 'tinggi';
}

class AnalisisSummaryDto {
    @ApiProperty({ example: 10 })
    totalPekerjaan: number;

    @ApiProperty({ example: 3 })
    tingkatRisikoTinggi: number;

    @ApiProperty({ example: 4 })
    tingkatRisikoSedang: number;

    @ApiProperty({ example: 3 })
    tingkatRisikoRendah: number;
}

export class RisikoPerPekerjaanResponse {
    @ApiProperty({ type: [AnalisisPerPekerjaanDto] })
    data: AnalisisPerPekerjaanDto[];

    @ApiProperty({ type: AnalisisSummaryDto })
    summary: AnalisisSummaryDto;
}
