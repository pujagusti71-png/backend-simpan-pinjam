import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async login(loginDto: LoginDto) {
        console.log('[AuthService] login() called');
        console.log('[AuthService] loginDto:', loginDto);
        console.log('[AuthService] typeof loginDto:', typeof loginDto);

        try {
            console.log('[AuthService] About to call prisma.admin.findUnique...');

            const admin = await this.prisma.admin.findUnique({
                where: { username: loginDto.username },
            });

            console.log('=== LOGIN DEBUG ===');
            console.log('Username:', loginDto.username);
            console.log('Admin found:', !!admin);
            if (admin) {
                console.log('Admin data:', {
                    id: admin.id,
                    username: admin.username,
                    passwordLength: admin.password.length,
                    isActive: admin.isActive,
                });
            }

            if (!admin) {
                throw new UnauthorizedException('Username atau password salah');
            }

            const isPasswordValid = await bcrypt.compare(
                loginDto.password,
                admin.password,
            );

            console.log('Password valid:', isPasswordValid);
            console.log('Password comparison:', {
                inputPassword: loginDto.password,
                storedPasswordHash: admin.password.substring(0, 20) + '...',
            });

            if (!isPasswordValid) {
                throw new UnauthorizedException('Username atau password salah');
            }

            if (!admin.isActive) {
                throw new UnauthorizedException('Admin account tidak aktif');
            }

            const payload = { sub: admin.id, username: admin.username, email: admin.email };
            const access_token = this.jwtService.sign(payload);

            return {
                access_token,
                admin: {
                    id: admin.id,
                    username: admin.username,
                    email: admin.email,
                    namaLengkap: admin.namaLengkap,
                },
            };
        } catch (error) {
            console.log('[AuthService] Caught error:', error);
            console.log('[AuthService] Error message:', error.message);
            console.log('[AuthService] Error type:', error.constructor.name);
            console.log('[AuthService] Error stack:', error.stack);

            if (error instanceof UnauthorizedException) {
                throw error;
            }
            // Handle database/connection errors
            throw new UnauthorizedException('Username atau password salah');
        }
    }

    async validateAdmin(id: number) {
        const admin = await this.prisma.admin.findUnique({
            where: { id },
        });

        if (!admin || !admin.isActive) {
            return null;
        }

        return admin;
    }

    async validateNasabah(id: number) {
        const nasabah = await this.prisma.nasabah.findUnique({
            where: { id },
            select: {
                id: true,
                nama: true,
                nik: true,
                pekerjaan: true,
                penghasilan: true,
                saldoRataRata: true,
                estimasiPengeluaran: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!nasabah) {
            return null;
        }

        return nasabah;
    }

    async initializeAdmin() {
        try {
            // Check if admin already exists
            const existingAdmin = await this.prisma.admin.findUnique({
                where: { username: 'admin' },
            });

            if (existingAdmin) {
                return {
                    success: true,
                    message: 'Admin user sudah ada',
                    admin: {
                        id: existingAdmin.id,
                        username: existingAdmin.username,
                        email: existingAdmin.email,
                    },
                };
            }

            // Hash password
            const hashedPassword = await bcrypt.hash('admin123', 10);

            // Create admin user
            const admin = await this.prisma.admin.create({
                data: {
                    username: 'admin',
                    password: hashedPassword,
                    email: 'admin@simpanpinjam.com',
                    namaLengkap: 'Administrator',
                    isActive: true,
                },
            });

            return {
                success: true,
                message: 'Admin user berhasil dibuat',
                admin: {
                    id: admin.id,
                    username: admin.username,
                    email: admin.email,
                    namaLengkap: admin.namaLengkap,
                },
            };
        } catch (error) {
            return {
                success: false,
                message: 'Gagal membuat admin user',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
