import {Global, Module} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {drizzle, type NodePgDatabase} from 'drizzle-orm/node-postgres';
import {Pool} from 'pg';

import {Service} from '../../common/enums';
import type {EnvironmentVariables} from '../../config/interfaces';
import {DatabaseService} from './database.service';

@Global()
@Module({
  providers: [
    {
      provide: Service.PostgresPool,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables, true>): Pool =>
        new Pool({
          connectionString: configService.getOrThrow('DATABASE_URL'),
          max: 10,
        }),
    },
    {
      provide: Service.Drizzle,
      inject: [Service.PostgresPool],
      useFactory: (pool: Pool): NodePgDatabase => drizzle({client: pool}),
    },
    DatabaseService,
  ],
  exports: [DatabaseService, Service.Drizzle],
})
export class DatabaseModule {}
