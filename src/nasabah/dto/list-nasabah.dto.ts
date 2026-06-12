export class ListNasabahDto {
    id: number;
    nama: string;
    nik: string;
    tanggalLahir: Date | null;
    pekerjaan: string;
    penghasilan: number;
    alamat: string | null;
    noHp: string | null;
    email: string | null;
    noRek: string | null;
    namaIbuKandung: string | null;
    alamatIbuKandung: string | null;
    tanggalLahirIbuKandung: Date | null;
    saldoRataRata: number | null;
    estimasiPengeluaran: number | null;
    createdAt: Date;
    updatedAt: Date;
}

export class PaginatedNasabahResponse {
    data: ListNasabahDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}
