export class NasabahEntity {
    id!: number;
    nama!: string;
    nik!: string;
    tanggalLahir?: Date;
    pekerjaan!: string;
    penghasilan!: number;
    alamat?: string;
    noHp?: string;
    email?: string;
    noRek?: string;
    namaIbuKandung?: string;
    alamatIbuKandung?: string;
    tanggalLahirIbuKandung?: Date;
    saldoRataRata?: number;
    estimasiPengeluaran?: number;
    createdAt!: Date;
    updatedAt!: Date;
}
