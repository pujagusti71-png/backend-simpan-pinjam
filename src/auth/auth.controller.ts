import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { Public } from './decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @Post('login')
    @ApiOperation({ summary: 'Admin login' })
    @ApiBody({
        type: LoginDto,
        examples: {
            admin: {
                summary: 'Login admin',
                value: {
                    username: 'admin',
                    password: 'admin123',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Login berhasil',
        schema: {
            example: {
                access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                admin: {
                    id: 1,
                    username: 'admin',
                    email: 'admin@example.com',
                    namaLengkap: 'Administrator',
                },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Username atau password salah',
    })
    async login(@Body() loginDto: LoginDto) {
        console.log('[AuthController] login() called with username:', loginDto.username);
        try {
            return await this.authService.login(loginDto);
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : 'Login gagal';
            if (error instanceof Error) {
                console.log('[AuthController] login() error:', error.message);
            }
            throw new HttpException(message, HttpStatus.UNAUTHORIZED);
        }
    }

    @Public()
    @Post('initialize')
    @ApiOperation({ summary: 'Initialize default admin user (Development only)' })
    @ApiResponse({
        status: 200,
        description: 'Admin user initialized',
    })
    async initialize() {
        return await this.authService.initializeAdmin();
    }
}
