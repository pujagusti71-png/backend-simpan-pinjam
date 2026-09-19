import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the API status payload', () => {
      expect(appController.getHello()).toEqual(
        expect.objectContaining({
          message: 'Welcome to Simpan Pinjam Backend API',
          version: '1.0',
          documentation: '/api',
          status: 'running',
        }),
      );
    });
  });
});
