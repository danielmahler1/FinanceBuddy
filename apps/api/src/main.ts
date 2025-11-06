import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file from project root before anything else
config({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || undefined;
  await app.listen(port, host);
  console.log(`Application is running on: http://${host || 'localhost'}:${port}`);
}

void bootstrap();
