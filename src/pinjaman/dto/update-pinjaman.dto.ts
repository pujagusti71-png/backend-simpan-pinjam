export class UpdatePinjamanDto {
    status?: 'pending' | 'approved' | 'active' | 'completed' | 'rejected';
    tanggalAsetujuan?: Date;
    tanggalSelesai?: Date;
}
