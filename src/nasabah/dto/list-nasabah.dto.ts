export class ListNasabahDto {
    id: number;
    nama: string;
    nik: string;
    pekerjaan: string;
    penghasilan: number;
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
