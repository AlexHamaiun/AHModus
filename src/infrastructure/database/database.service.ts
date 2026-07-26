import {Injectable, OnApplicationShutdown} from '@nestjs/common';
import {Inject} from '@nestjs/common';
import {sql} from 'drizzle-orm';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';
import type {Pool} from 'pg';

import {Service} from '../../common/enums';

interface IDatabaseService {
  checkConnection(): Promise<void>;
}

@Injectable()
class DatabaseService implements IDatabaseService, OnApplicationShutdown {
  constructor(
    @Inject(Service.Drizzle) private readonly database: NodePgDatabase,
    @Inject(Service.PostgresPool) private readonly pool: Pool,
  ) {}

  async checkConnection(): Promise<void> {
    await this.database.execute(sql`SELECT 1`);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}

export {type IDatabaseService, DatabaseService};
