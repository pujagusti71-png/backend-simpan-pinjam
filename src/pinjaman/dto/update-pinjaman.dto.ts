import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePinjamanDto {
    @ApiPropertyOptional({ enum: ['pending', 'approved', 'active', 'completed', 'rejected'], description: 'Status pinjaman' })
    status?: 'pending' | 'approved' | 'active' | 'completed' | 'rejected';

    @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Tanggal persetujuan jika ada' })
    tanggalAsetujuan?: Date;

    @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Tanggal selesai pinjaman jika ada' })
    tanggalSelesai?: Date;
}
