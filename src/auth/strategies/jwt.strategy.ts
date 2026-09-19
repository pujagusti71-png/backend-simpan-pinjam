import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
        });
    }

    async validate(payload: any) {
        // First try to validate as admin
        const admin = await this.authService.validateAdmin(payload.sub);
        if (admin) {
            return {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: 'admin',
            };
        }

        // If not admin, try nasabah
        const nasabah = await this.authService.validateNasabah(payload.sub as number);
        if (nasabah) {
            return {
                id: nasabah.id,
                nama: nasabah.nama,
                nik: nasabah.nik,
                role: 'nasabah',
            };
        }

        return null;
    }
}
