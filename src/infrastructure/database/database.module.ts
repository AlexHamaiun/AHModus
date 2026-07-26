import {Global, Module} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {drizzle, type NodePgDatabase} from 'drizzle-orm/node-postgres';
import {Pool} from 'pg';

import {Service} from '../../common/enums';
import type {IEnvironmentVariables} from '../../config/interfaces';
import {DatabaseService} from './database.service';

@Global()
@Module({
  providers: [
    {
      provide: Service.PostgresPool,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<IEnvironmentVariables, true>): Pool =>
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
    {
      provide: Service.Database,
      useClass: DatabaseService,
    },
  ],
  exports: [Service.Database, Service.Drizzle],
})
export class DatabaseModule {}
