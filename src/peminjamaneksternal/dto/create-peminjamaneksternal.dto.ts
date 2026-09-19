import { ApiProperty } from '@nestjs/swagger';

export class CreatePeminjamanEksternalDto {
    @ApiProperty({ example: 1, description: 'ID nasabah' })
    nasabahId: number;

    @ApiProperty({ example: 500000, description: 'Jumlah pinjaman dari sumber eksternal' })
    jumlahPinjaman: number;

    @ApiProperty({ example: 'C', description: 'Kolektibilitas pinjaman eksternal' })
    kolektibilitas: string;

    @ApiProperty({ example: 'Koperasi X', description: 'Sumber pinjaman eksternal' })
    sumberPinjaman: string;
}
