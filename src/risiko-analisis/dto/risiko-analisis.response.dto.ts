export class RisikoAnalisisResponseDto {
    rasioSiklusPersentase: number;
    skorRisiko: number;
    kategoriRisiko: 'rendah' | 'sedang' | 'tinggi';
    persentaseKeterlambatan: number;
    frekuensiPinjaman: number;
    penjumlahPeminjamanAktif: number;
    indikasiBehaviorBerisiko: string;
    rekomendasi: 'approve' | 'review' | 'reject';
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
