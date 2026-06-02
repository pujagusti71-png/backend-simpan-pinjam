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
        try {
            const admin = await this.prisma.admin.findUnique({
                where: { username: loginDto.username },
            });

            if (!admin) {
                throw new UnauthorizedException('Username atau password salah');
            }

            const isPasswordValid = await bcrypt.compare(
                loginDto.password,
                admin.password,
            );

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
