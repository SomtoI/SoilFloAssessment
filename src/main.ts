import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { decorateApp, logStartup } from './app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  decorateApp(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logStartup(port);
}

bootstrap();
