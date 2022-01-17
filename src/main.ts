import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });
import { NestFactory } from '@nestjs/core';
import * as helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';

import { AppModule } from './app.module';
import { AppConfig } from './modules/configuration/configuration.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
  const config = app.get(AppConfig);
  const port = config.values.app.port;

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  app.enableCors({ origin: true });
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe());

  const options = new DocumentBuilder()
    .setTitle('Boilerplate API')
    .setDescription('Boilerplate API description')
    .setVersion('1.0')
    .addTag('health')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
}

bootstrap();
