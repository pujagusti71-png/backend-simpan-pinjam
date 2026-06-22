import { ApiProperty } from '@nestjs/swagger';

export class StatistikPerPekerjaanResponseDto {
    @ApiProperty({ example: 'Guru' })
    pekerjaan: string;

    @ApiProperty({ example: 100 })
    totalNasabah: number;

    @ApiProperty({ example: 25 })
    nasabahDenganPinjaman: number;

    @ApiProperty({ example: 75 })
    nasabahBelumPinjam: number;

    @ApiProperty({ example: 10 })
    nasabahTelat: number;

    @ApiProperty({ example: 90 })
    nasabahLancar: number;

    @ApiProperty({ example: 4500000 })
    rataRataPenghasilan: number;

    @ApiProperty({ example: 1250000 })
    totalCicilanBulanan: number;

    @ApiProperty({ example: 27.78 })
    rataRataRasioCikilan: number;

    @ApiProperty({ example: 10 })
    risikoTinggi: number;

    @ApiProperty({ example: 5 })
    risikoSedang: number;

    @ApiProperty({ example: 10 })
    risikoRendah: number;
}
