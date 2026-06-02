export class AnalisisPerPekerjaanDto {
    pekerjaan: string;
    totalNasabah: number;
    nasabahTelat: number;
    nasabahLancar: number;
    persentaseKeterlambatan: number;
    rataRataPenghasilan: number;
    rataRataRasioCikilan: number;
    tingkatRisiko: 'rendah' | 'sedang' | 'tinggi';
}

export class RisikoPerPekerjaanResponse {
    data: AnalisisPerPekerjaanDto[];
    summary: {
        totalPekerjaan: number;
        tingkatRisikoTinggi: number;
        tingkatRisikoSedang: number;
        tingkatRisikoRendah: number;
    };
}
