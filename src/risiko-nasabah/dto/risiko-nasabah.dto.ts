import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PreLoanCheckDto {
    @ApiProperty({ example: 1, description: 'ID nasabah' })
    nasabahId: number;

    @ApiProperty({ example: 5000000, description: 'Jumlah pinjaman yang diajukan' })
    jumlahPinjaman: number;

    @ApiProperty({ example: 12, description: 'Tenor pinjaman dalam bulan' })
    tenor: number;

    @ApiPropertyOptional({ example: 'flat', enum: ['flat', 'efektif'] })
    jenisBunga?: 'flat' | 'efektif';
}

export class DetailSkorDto {
    @ApiProperty({ example: 10, description: 'Skor dari jenis pekerjaan (0-30)' })
    skorPekerjaan: number;

    @ApiProperty({ example: 15, description: 'Skor dari rasio cicilan terhadap penghasilan (0-30)' })
    skorRasioCicilan: number;

    @ApiProperty({ example: 10, description: 'Skor dari riwayat pembayaran (0-20)' })
    skorRiwayatPembayaran: number;

    @ApiProperty({ example: 5, description: 'Skor dari pinjaman eksternal/SLIK (0-10)' })
    skorPinjamanEksternal: number;

    @ApiProperty({ example: 5, description: 'Skor dari perilaku pinjaman (0-10)' })
    skorBehavior: number;

    @ApiProperty({ example: 45, description: 'Total skor (0-100)' })
    totalSkor: number;
}

export class RisikoNasabahResponseDto {
    @ApiProperty({ example: 1 })
    nasabahId: number;

    @ApiProperty({ example: 'Budi Santoso' })
    nama: string;

    @ApiProperty({ example: 'PNS' })
    pekerjaan: string;

    @ApiProperty({ example: 5000000 })
    penghasilan: number;

    @ApiProperty({ example: 1200000 })
    cicilanBulanan: number;

    @ApiProperty({ example: 24, description: 'Rasio cicilan terhadap penghasilan (%)' })
    rasioCicilan: number;

    @ApiProperty({ example: 65, description: 'Skor risiko total 0-100' })
    skorRisiko: number;

    @ApiProperty({ example: 'sedang', enum: ['rendah', 'sedang', 'tinggi'] })
    kategoriRisiko: string;

    @ApiProperty({ example: 'approve', enum: ['approve', 'review', 'reject'] })
    rekomendasi: string;

    @ApiPropertyOptional({ example: 'Frekuensi pinjaman tinggi; Pernah telat bayar' })
    indikasiBehaviorBerisiko: string | null;

    @ApiProperty({ type: () => DetailSkorDto })
    detailSkor: DetailSkorDto;
}

export class BICheckingSummaryDto {
    @ApiProperty({ example: 1 })
    nasabahId: number;

    @ApiProperty({ example: 2, description: 'Jumlah pinjaman aktif di luar koperasi ini' })
    totalPinjamanAktif: number;

    @ApiProperty({ example: 10000000, description: 'Total jumlah pinjaman eksternal' })
    totalJumlahEksternal: number;

    @ApiProperty({ example: 'aman', enum: ['aman', 'bermasalah'] })
    statusBI: string;

    @ApiProperty({ example: false })
    pernahMacet: boolean;

    @ApiProperty({ example: ['A', 'B'], description: 'Daftar kolektibilitas dari semua pinjaman eksternal' })
    kolektibilitasList: string[];

    @ApiPropertyOptional({ example: 'Kolektibilitas D/E ditemukan' })
    catatan: string | null;
}

export class PreLoanCheckResponseDto {
    @ApiProperty({ example: 1 })
    nasabahId: number;

    @ApiProperty({ example: 'Budi Santoso' })
    nama: string;

    @ApiProperty({ example: 5000000 })
    penghasilan: number;

    @ApiProperty({ example: 5000000 })
    jumlahPinjaman: number;

    @ApiProperty({ example: 12 })
    tenor: number;

    @ApiProperty({ example: 500000 })
    estimasiCicilanBulanan: number;

    @ApiProperty({ example: 10, description: 'Rasio cicilan baru terhadap penghasilan (%)' })
    rasioCicilanBaru: number;

    @ApiProperty({ example: 35, description: 'Total rasio cicilan termasuk cicilan yang sudah ada (%)' })
    rasioTotalCicilan: number;

    @ApiProperty({ example: 'layak', enum: ['layak', 'berisiko', 'ditolak'] })
    statusKelayakan: string;

    @ApiProperty({ example: 'Rasio cicilan masih dalam batas aman', isArray: true })
    alasan: string[];

    @ApiProperty({ example: 'approve', enum: ['approve', 'review', 'reject'] })
    rekomendasiAwal: string;
}
