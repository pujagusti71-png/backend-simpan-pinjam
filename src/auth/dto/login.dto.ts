import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        description: 'Username admin',
        example: 'admin',
    })
    username: string;

    @ApiProperty({
        description: 'Password admin',
        example: 'password123',
    })
    password: string;
}
