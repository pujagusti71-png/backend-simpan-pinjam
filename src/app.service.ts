import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: 'Welcome to Simpan Pinjam Backend API',
      version: '1.0',
      documentation: '/api',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }
}
