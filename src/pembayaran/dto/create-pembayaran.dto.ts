import { ApiProperty } from '@nestjs/swagger';

export class CreatePembayaranDto {
    @ApiProperty({ example: 1, description: 'ID pinjaman yang dibayar' })
    pinjamanId: number;

    @ApiProperty({ example: 150000, description: 'Jumlah pembayaran (dalam rupiah)' })
    jumlahBayar: number;

    @ApiProperty({ example: 'lancar', enum: ['lancar', 'telat'], description: 'Status pembayaran' })
    statusBayar: 'lancar' | 'telat';

    @ApiProperty({
        required: false,
        example: '2026-06-13T00:00:00Z',
        description: 'Tanggal seharusnya bayar, dalam format ISO 8601',
        type: String,
    })
    dariTanggalSeharusnya?: string | Date;
}
