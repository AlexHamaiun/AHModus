import {ValidationPipe} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {NestFactory} from '@nestjs/core';
import {Logger, LoggerErrorInterceptor} from 'nestjs-pino';

import {AppModule} from './app.module';
import type {IEnvironmentVariables} from './config/interfaces';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {bufferLogs: true});
  const configService = app.get<ConfigService<IEnvironmentVariables, true>>(ConfigService);

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('v1');
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
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
