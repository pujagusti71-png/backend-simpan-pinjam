export class CreateNasabahDto {
    nama: string;
    nik: string;
    pekerjaan: string; // PNS, Freelance, Petani, dll
    penghasilan: number; // Penghasilan per bulan
    saldoRataRata?: number;
    estimasiPengeluaran?: number;
}
