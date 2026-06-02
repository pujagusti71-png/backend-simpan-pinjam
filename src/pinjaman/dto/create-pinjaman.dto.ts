import { ApiProperty } from '@nestjs/swagger';

export class CreatePinjamanDto {
    @ApiProperty({ example: 1, description: 'ID nasabah' })
    nasabahId: number;

    @ApiProperty({ example: 1000000, description: 'Jumlah pinjaman dalam satuan terkecil (mis. rupiah)' })
    jumlahPinjaman: number;

    @ApiProperty({ example: 12, description: 'Tenor pinjaman dalam bulan' })
    tenor: number; // in months

    @ApiProperty({ example: 5, description: 'Suku bunga dalam persen' })
    sukuBunga: number; // in percent

    @ApiProperty({ example: 'flat', enum: ['flat', 'efektif'], description: 'Jenis perhitungan bunga' })
    jenisBunga: 'flat' | 'efektif';
}
