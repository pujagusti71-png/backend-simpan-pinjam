export class ListSimpananDto {
    id: number;
    nasabahId: number;
    jumlahSetoran: number;
    bungaSimpanan?: number;
    jenisInterest?: string;
    tanggalSetoran: Date;
    saldoAkhir: number;
    status: string;
    keterangan?: string;
    createdAt: Date;
    updatedAt: Date;
}

export class PaginatedSimpananResponse {
    data: ListSimpananDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}
