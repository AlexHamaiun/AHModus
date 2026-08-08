import {Global, Module, RequestMethod} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {LoggerModule} from 'nestjs-pino';

import {Service} from '../../common/enums';
import {AppConfigModule} from '../../config/config.module';
import type {IEnvironmentVariables} from '../../config/interfaces';
import {LoggingService} from './logging.service';
import {createPinoHttpOptions} from './pino-http.options';

@Global()
@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<IEnvironmentVariables, true>) => ({
        forRoutes: [{path: '/{*path}', method: RequestMethod.ALL}],
        pinoHttp: createPinoHttpOptions(configService.getOrThrow('LOG_LEVEL')),
      }),
    }),
  ],
  providers: [
    {
      provide: Service.Logging,
      useClass: LoggingService,
    },
  ],
  exports: [Service.Logging],
})
class LoggingModule {}

export {LoggingModule};
