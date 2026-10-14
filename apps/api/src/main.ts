import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  });
  app.getHttpAdapter().get('/health', (_req, res) => res.send('ok'));
  app.setGlobalPrefix('api', { exclude: ['health'] });
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
}
bootstrap();
