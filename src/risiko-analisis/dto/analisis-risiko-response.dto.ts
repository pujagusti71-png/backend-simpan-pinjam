import { ApiProperty } from '@nestjs/swagger';

export class ScoreComponentDto {
    @ApiProperty({ example: 95, description: 'Skor pada kategori ini' })
    skor!: number;

    @ApiProperty({ example: 'PNS', description: 'Nilai input yang digunakan untuk menghitung skor' })
    nilai!: string | number;
}

export class AnalisisRisikoDetailDto {
    @ApiProperty({ type: ScoreComponentDto })
    pekerjaan!: ScoreComponentDto;

    @ApiProperty({ type: ScoreComponentDto })
    penghasilan!: ScoreComponentDto;

    @ApiProperty({ type: ScoreComponentDto })
    lamaBekerja!: ScoreComponentDto;

    @ApiProperty({ type: ScoreComponentDto })
    riwayatPembayaran!: ScoreComponentDto;

    @ApiProperty({ type: ScoreComponentDto })
    jumlahTanggungan!: ScoreComponentDto;

    @ApiProperty({ example: 82.5, description: 'Nilai total skor setelah bobot diterapkan' })
    totalSkor!: number;

    @ApiProperty({ example: 'Pekerjaan×0.30 + Penghasilan×0.25 + LamaBekerja×0.15 + RiwayatPembayaran×0.20 + JumlahTanggungan×0.10' })
    formula!: string;
}

export class AnalisisRisikoResponseDto {
    @ApiProperty({ example: 1, description: 'ID analisis risiko' })
    id!: number;

    @ApiProperty({ example: 10, description: 'ID nasabah' })
    nasabahId!: number;

    @ApiProperty({ example: 'Budi Santoso', description: 'Nama nasabah' })
    namaNasabah!: string;

    @ApiProperty({ example: 'PNS', description: 'Pekerjaan nasabah' })
    pekerjaan!: string;

    @ApiProperty({ example: 5000000, description: 'Penghasilan nasabah per bulan' })
    penghasilan!: number;

    @ApiProperty({ example: 3, description: 'Lama bekerja dalam tahun' })
    lamaBekerja!: number;

    @ApiProperty({ example: 'Selalu Tepat Waktu', description: 'Riwayat pembayaran nasabah' })
    riwayatPembayaran!: string;

    @ApiProperty({ example: 2, description: 'Jumlah tanggungan nasabah' })
    jumlahTanggungan!: number;

    @ApiProperty({ example: 95, description: 'Skor pekerjaan' })
    skorPekerjaan!: number;

    @ApiProperty({ example: 90, description: 'Skor penghasilan' })
    skorPenghasilan!: number;

    @ApiProperty({ example: 80, description: 'Skor lama bekerja' })
    skorLamaBekerja!: number;

    @ApiProperty({ example: 100, description: 'Skor riwayat pembayaran' })
    skorRiwayat!: number;

    @ApiProperty({ example: 90, description: 'Skor jumlah tanggungan' })
    skorTanggungan!: number;

    @ApiProperty({ example: 89.5, description: 'Total skor akhir' })
    totalSkor!: number;

    @ApiProperty({ example: 'Sangat Layak', description: 'Status kelayakan berdasarkan total skor' })
    status!: string;

    @ApiProperty({ type: AnalisisRisikoDetailDto, description: 'Detail perhitungan skor per kategori' })
    detail!: AnalisisRisikoDetailDto;

    @ApiProperty({ example: '2026-06-08T12:34:56.789Z', description: 'Waktu analisis disimpan' })
    createdAt!: Date;
}
