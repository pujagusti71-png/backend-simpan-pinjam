import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Backend Simpan Pinjam API')
    .setDescription('Dokumentasi Swagger untuk backend simpan pinjam')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const requestedPort = Number(process.env.PORT ?? 3001);
  let port = requestedPort;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      await app.listen(port, '0.0.0.0');
      console.log(`Application is listening on port ${port} (0.0.0.0)`);
      return;
    } catch (error: any) {
      if (error?.code === 'EADDRINUSE' && attempt < 9) {
        port += 1;
        console.warn(`Port ${port - 1} is already in use. Trying port ${port}...`);
      } else {
        throw error;
      }
    }
  }
}
bootstrap().catch((err) => {
  console.error('FATAL ERROR DURING BOOTSTRAP:', err);
  process.exit(1);
});
