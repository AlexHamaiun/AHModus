import {AsyncLocalStorage} from 'node:async_hooks';

import {Inject, Injectable, OnApplicationShutdown} from '@nestjs/common';
import {sql} from 'drizzle-orm';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';
import type {Pool} from 'pg';

import {Service} from '../../common/enums';
import type {DatabaseExecutor} from './types';

interface IDatabaseService {
  checkConnection(): Promise<void>;
  executeInTransaction<TResult>(operation: () => Promise<TResult>): Promise<TResult>;
  getExecutor(): DatabaseExecutor;
}

@Injectable()
class DatabaseService implements IDatabaseService, OnApplicationShutdown {
  private readonly transactionStorage = new AsyncLocalStorage<DatabaseExecutor>();

  constructor(
    @Inject(Service.Drizzle) private readonly database: NodePgDatabase,
    @Inject(Service.PostgresPool) private readonly pool: Pool,
  ) {}

  async checkConnection(): Promise<void> {
    await this.database.execute(sql`SELECT 1`);
  }

  async executeInTransaction<TResult>(operation: () => Promise<TResult>): Promise<TResult> {
    if (this.transactionStorage.getStore() !== undefined) {
      return operation();
    }

    return this.database.transaction((transaction) =>
      this.transactionStorage.run(transaction, operation),
    );
  }

  getExecutor(): DatabaseExecutor {
    return this.transactionStorage.getStore() ?? this.database;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}

export {type IDatabaseService, DatabaseService};
