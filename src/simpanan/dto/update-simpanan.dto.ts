export class UpdateSimpananDto {
    jumlahSetoran?: number;
    bungaSimpanan?: number;
    jenisInterest?: 'flat' | 'efektif';
    status?: string;
    keterangan?: string;
}
