import { ApiProperty } from '@nestjs/swagger';

export class UpdateAnalisisPerPekerjaanResponseDto {
    @ApiProperty({ example: 'Analisis per pekerjaan berhasil diperbarui' })
    message: string;

    @ApiProperty({ example: 8 })
    totalRecords: number;
}
