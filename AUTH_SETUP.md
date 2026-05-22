# Admin Authentication Setup

Auth module sudah di-implement dengan JWT (JSON Web Tokens) untuk protect endpoints.

## Fitur

✅ Admin login dengan username dan password
✅ JWT token generation (expires dalam 24 jam)
✅ Password hashing dengan bcrypt
✅ Global JWT guard untuk protect semua endpoints
✅ @Public() decorator untuk mark public endpoints

## Struktur

```
src/auth/
  ├── auth.controller.ts      # Login endpoint
  ├── auth.service.ts         # Login logic, password verification
  ├── auth.module.ts          # Auth module configuration
  ├── decorators/
  │   └── public.decorator.ts # Mark endpoints sebagai public
  ├── guards/
  │   └── jwt-auth.guard.ts   # JWT authentication guard
  ├── strategies/
  │   └── jwt.strategy.ts     # Passport JWT strategy
  └── dto/
      └── login.dto.ts        # Login request DTO
```

## Setup Steps

### 1. Database Migration
Setelah database tersedia, jalankan:
```bash
npx prisma migrate deploy
```

Atau jika ada pending migrations:
```bash
npx prisma migrate dev
```

### 2. Create Admin User
Ada dua cara untuk membuat admin user:

**Cara 1: Using Seed Script**
```bash
npm run prisma:seed
```

Default admin credentials:
- Username: `admin`
- Password: `admin123`
- Email: `admin@simpanpinjam.com`

**Cara 2: Manual dengan Prisma Studio**
```bash
npx prisma studio
```
Kemudian buat admin user di UI.

### 3. Environment Variables
Pastikan `.env` sudah punya:
```env
DATABASE_URL=...
PORT=3000
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

## Usage

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "username": "admin",
    "email": "admin@simpanpinjam.com",
    "namaLengkap": "Administrator"
  }
}
```

### Protected Endpoints
Untuk akses protected endpoints, include token di Authorization header:
```bash
GET /nasabah
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Public Endpoints
Login endpoint adalah public (tidak perlu token):
```bash
POST /auth/login
```

## Protect Existing Endpoints

Semua endpoints sudah protected karena ada global JWT guard di `app.module.ts`.

Untuk membuat endpoint public, gunakan @Public() decorator:

```typescript
import { Public } from './auth/decorators';

@Controller('example')
export class ExampleController {
  @Public()
  @Get('public-data')
  getPublicData() {
    return { message: 'This is public' };
  }

  @Get('protected-data')  // Memerlukan token
  getProtectedData() {
    return { message: 'This is protected' };
  }
}
```

## JWT Token

Token expires dalam **24 jam**. Kalau mau ubah, edit di `auth.module.ts`:

```typescript
JwtModule.register({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  signOptions: { expiresIn: '48h' },  // Change to 48h
}),
```

## Security Notes

⚠️ **IMPORTANT:**
1. Change `JWT_SECRET` in `.env` sebelum production
2. Hash password di seed script sudah menggunakan bcrypt dengan salt rounds 10
3. Password never exposed di token (hanya username dan email)
4. Token dikirim dalam response, bukan disimpan di DB

## Troubleshooting

### Database Connection Error
Jika database tidak tersedia, migration akan gagal. Tunggu database online, kemudian retry:
```bash
npx prisma migrate deploy
```

### JWT Verification Failed
- Check `JWT_SECRET` di `.env`
- Check token format di Authorization header
- Check token expiration time

### Password Not Hashing
Seed script sudah handle hashing. Jika manual create, gunakan bcrypt:
```typescript
const hashed = await bcrypt.hash(password, 10);
```
