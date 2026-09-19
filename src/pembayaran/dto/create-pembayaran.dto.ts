import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePembayaranDto {
    @ApiProperty({ example: 1, description: 'ID pinjaman yang dibayar' })
    pinjamanId: number;

    @ApiPropertyOptional({ example: 1, description: 'Nomor cicilan yang dibayar. Jika tidak diisi, akan ditentukan otomatis.' })
    nomorCicilan?: number;

    @ApiProperty({ example: 150000, description: 'Jumlah pembayaran (dalam rupiah)' })
    jumlahBayar: number;

    @ApiPropertyOptional({ example: 500000, description: 'Jumlah pokok cicilan yang dibayar' })
    jumlahPokok?: number;

    @ApiPropertyOptional({ example: 25000, description: 'Jumlah bunga cicilan yang dibayar' })
    jumlahBunga?: number;

    @ApiPropertyOptional({ example: '2026-09-02T00:00:00.000Z', description: 'Tanggal pembayaran dalam format ISO 8601' })
    tanggalPembayaran?: string | Date;

    @ApiPropertyOptional({ example: '2026-09-02T00:00:00.000Z', description: 'Alias tanggal pembayaran untuk kompatibilitas payload lama' })
    tanggalBayar?: string | Date;

    @ApiPropertyOptional({ example: 'lancar', enum: ['lancar', 'telat'], description: 'Status pembayaran' })
    statusBayar?: 'lancar' | 'telat';

    @ApiPropertyOptional({
        example: '2026-06-13T00:00:00Z',
        description: 'Tanggal seharusnya bayar, dalam format ISO 8601',
        type: String,
    })
    dariTanggalSeharusnya?: string | Date;
}
