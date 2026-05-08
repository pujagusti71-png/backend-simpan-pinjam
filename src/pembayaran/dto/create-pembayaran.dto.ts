export class CreatePembayaranDto {
    pinjamanId: number;
    jumlahBayar: number;
    statusBayar: 'lancar' | 'telat';
    dariTanggalSeharusnya?: Date;
}
