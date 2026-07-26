import {ValidationPipe} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {NestFactory} from '@nestjs/core';

import {AppModule} from './app.module';
import type {IEnvironmentVariables} from './config/interfaces';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService<IEnvironmentVariables, true>>(ConfigService);

  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(configService.getOrThrow('PORT'));
}

void bootstrap();
