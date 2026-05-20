import { ApiProperty } from '@nestjs/swagger';

export class RisikoAnalisisResponseDto {
    @ApiProperty({ example: 25, description: 'Rasio cicilan terhadap penghasilan dalam persen' })
    rasioSiklusPersentase: number;

    @ApiProperty({ example: 70, description: 'Skor risiko total dari 0 sampai 100' })
    skorRisiko: number;

    @ApiProperty({ example: 'sedang', description: 'Kategori risiko: rendah, sedang, tinggi' })
    kategoriRisiko: 'rendah' | 'sedang' | 'tinggi';

    @ApiProperty({ example: 15, description: 'Persentase keterlambatan pembayaran' })
    persentaseKeterlambatan: number;

    @ApiProperty({ example: 3, description: 'Jumlah pinjaman nasabah' })
    frekuensiPinjaman: number;

    @ApiProperty({ example: 1, description: 'Jumlah pinjaman aktif saat ini' })
    penjumlahPeminjamanAktif: number;

    @ApiProperty({ example: 'Tidak ada indikasi berisiko', description: 'Indikasi perilaku berisiko nasabah' })
    indikasiBehaviorBerisiko: string;

    @ApiProperty({ example: 'review', description: 'Rekomendasi keputusan kredit' })
    rekomendasi: 'approve' | 'review' | 'reject';

    @ApiProperty({ description: 'Detail analisis risiko dalam beberapa bagian', type: Object })
    detailAnalisis: {
        preLoanChecking: {
            penghasilan: number;
            cicilan: number;
            rasio: number;
            status: string;
        };
        biChecking: {
            totalPinjamanAktif: number;
            statusBI: string;
            kolektibilitas: string;
        };
        riwayatPembayaran: {
            totalPembayaran: number;
            telat: number;
            lancar: number;
            persentaseTelat: number;
        };
        behaviorDetection: {
            frekuensi: number;
            pola: string[];
            risikoAktivitas: string;
        };
    };
}
