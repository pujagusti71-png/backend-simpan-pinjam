export class CreatePinjamanDto {
    nasabahId: number;
    jumlahPinjaman: number;
    tenor: number; // in months
    sukuBunga: number; // in percent
    jenisBunga: 'flat' | 'efektif';
}
