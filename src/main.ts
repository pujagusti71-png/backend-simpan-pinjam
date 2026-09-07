import * as dotenv from 'dotenv';
dotenv.config();

import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.useStaticAssets(join(process.cwd(), 'frontend', 'dist'), { index: 'index.html' });

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

  const requestedPort = Number(process.env.PORT ?? 3000);
  const portsToTry = [requestedPort, requestedPort + 1, requestedPort + 2, requestedPort + 3, requestedPort + 4];

  for (const port of portsToTry) {
    try {
      await app.listen(port);
      console.log(`Application listening on port ${port}`);
      return;
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
        console.warn(`Port ${port} is busy, trying next port...`);
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Unable to start application. All ports in range ${portsToTry[0]}-${portsToTry[portsToTry.length - 1]} are busy.`);
}
bootstrap();
