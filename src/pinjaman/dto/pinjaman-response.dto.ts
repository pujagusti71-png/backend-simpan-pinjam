import { ApiProperty } from '@nestjs/swagger';

export class NasabahResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Budi Santoso' })
    nama: string;

    @ApiProperty({ example: '3204123456789012' })
    nik: string;

    @ApiProperty({ example: 'PNS' })
    pekerjaan: string;

    @ApiProperty({ example: 5000000 })
    penghasilan: number;

    @ApiProperty({ example: 200000 })
    saldoRataRata?: number;

    @ApiProperty({ example: 1500000 })
    estimasiPengeluaran?: number;
}

export class PembayaranResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 100000 })
    jumlahBayar: number;

    @ApiProperty({ type: String, format: 'date-time' })
    tanggalBayar: Date;

    @ApiProperty({ example: 'lancar' })
    statusBayar: string;
}

export class PinjamanResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ type: NasabahResponseDto })
    nasabah: NasabahResponseDto;

    @ApiProperty({ example: 1000000 })
    jumlahPinjaman: number;

    @ApiProperty({ example: 12 })
    tenor: number;

    @ApiProperty({ example: 5 })
    sukuBunga: number;

    @ApiProperty({ example: 'flat' })
    jenisBunga: string;

    @ApiProperty({ example: 100000 })
    cicilanBulanan?: number;

    @ApiProperty({ example: 200000 })
    totalBunga?: number;

    @ApiProperty({ example: 1200000 })
    totalPembayaran?: number;

    @ApiProperty({ example: 'active' })
    status: string;

    @ApiProperty({ type: [PembayaranResponseDto] })
    pembayaran?: PembayaranResponseDto[];

    @ApiProperty({ type: String, format: 'date-time' })
    createdAt: Date;

    @ApiProperty({ type: String, format: 'date-time' })
    updatedAt: Date;
}
