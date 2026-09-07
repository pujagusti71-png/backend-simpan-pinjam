import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('should create default admin automatically when database is empty', async () => {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const prisma = {
      admin: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: 1,
            username: 'admin',
            password: hashedPassword,
            email: 'admin@simpanpinjam.com',
            namaLengkap: 'Administrator',
            isActive: true,
          }),
        create: jest.fn().mockResolvedValue({
          id: 1,
          username: 'admin',
          password: hashedPassword,
          email: 'admin@simpanpinjam.com',
          namaLengkap: 'Administrator',
          isActive: true,
        }),
      },
    };

    const jwtService = { sign: jest.fn().mockReturnValue('token-123') };
    const service = new AuthService(prisma as any, jwtService as any);

    const result = await service.login({ username: 'admin', password: 'admin123' } as any);

    expect(prisma.admin.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          username: 'admin',
          email: 'admin@simpanpinjam.com',
          namaLengkap: 'Administrator',
        }),
      }),
    );
    expect(result).toMatchObject({ access_token: 'token-123' });
  });
});
