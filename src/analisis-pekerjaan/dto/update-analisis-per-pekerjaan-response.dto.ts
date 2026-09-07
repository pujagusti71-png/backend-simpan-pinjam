import { ApiProperty } from '@nestjs/swagger';

export class UpdateAnalisisPerPekerjaanResponseDto {
    @ApiProperty({ example: 'r pekerjaan berhasil diperbarui' })
    message: string;

    @ApiProperty({ example: 8 })
    totalRecords: number;
}
