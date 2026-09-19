export class PembayaranEntity {
    id: number;
    pinjamanId: number;
    jumlahBayar: number;
    tanggalBayar: Date;
    statusBayar: string;
    dariTanggalSeharusnya?: Date;
    createdAt: Date;
    updatedAt: Date;
}
