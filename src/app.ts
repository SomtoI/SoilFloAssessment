import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

export function decorateApp(app: INestApplication): void {
  app.setGlobalPrefix('api/v1');

  app.useGlobalFilters(new GlobalExceptionFilter(), new PrismaExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('SoilFLO API')
    .setDescription('Construction site material dispatch management API')
    .setVersion('1.0')
    .addTag('sites')
    .addTag('trucks')
    .addTag('tickets')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}

export function logStartup(port: number | string): void {
  const logger = new Logger('Bootstrap');
  logger.log(`Server running on http://localhost:${port}/api/v1`);
  logger.log(`API docs at http://localhost:${port}/api/docs`);
}
