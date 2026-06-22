import { ApiProperty } from '@nestjs/swagger';

export class CurrentBalanceDto {
    @ApiProperty({ example: 120000, description: 'Saldo saat ini untuk nasabah' })
    saldoSaatIni: number;
}
