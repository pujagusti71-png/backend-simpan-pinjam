export class CreateSimpananDto {
    nasabahId: number;
    jumlahSetoran: number;
    bungaSimpanan?: number;
    jenisInterest?: 'flat' | 'efektif';
    tanggalSetoran?: Date;
    keterangan?: string;
}
