import { NotFoundException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

describe('AuthController', () => {
    it('disables default admin initialization in production', async () => {
        const previousNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        const authService = { initializeAdmin: jest.fn() };
        const controller = new AuthController(authService as any);

        try {
            expect(Reflect.getMetadata(IS_PUBLIC_KEY, AuthController.prototype.initialize)).toBeUndefined();
            await expect(controller.initialize()).rejects.toBeInstanceOf(NotFoundException);
            expect(authService.initializeAdmin).not.toHaveBeenCalled();
        } finally {
            if (previousNodeEnv === undefined) {
                delete process.env.NODE_ENV;
            } else {
                process.env.NODE_ENV = previousNodeEnv;
            }
        }
    });
});