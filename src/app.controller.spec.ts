import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  it('should be defined', async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    expect(app.get<AppController>(AppController)).toBeInstanceOf(AppController);
  });
});
