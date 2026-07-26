import {ConflictException} from '@nestjs/common';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';

import type {IBaseService} from '../../common/interfaces';
import type {TransactionOptions} from '../../common/types';
import {PostgresErrorCode} from './enums';
import type {IBaseRepository} from './interfaces';
import {hasPostgresErrorCode} from './postgres-error.guard';
import type {DatabaseExecutor} from './types';

export abstract class BaseService<
  TEntity,
  TCreateInput,
  TUpdateInput,
  TCreateResult = TEntity,
  TId = string,
> implements IBaseService<TEntity, TCreateInput, TUpdateInput, TCreateResult, TId> {
  protected constructor(
    private readonly database: NodePgDatabase,
    private readonly repository: IBaseRepository<
      TEntity,
      TCreateInput,
      TUpdateInput,
      TCreateResult,
      TId
    >,
    protected readonly entityName: string,
  ) {}

  async create(input: TCreateInput, options?: TransactionOptions): Promise<TCreateResult> {
    try {
      return await this.executeMutation(
        (executor) => this.repository.create(executor, input),
        options,
      );
    } catch (error: unknown) {
      this.throwCreateError(error, input);
    }
  }

  async findAll(): Promise<readonly TEntity[]> {
    return this.repository.findAll(this.database);
  }

  async findById(id: TId): Promise<TEntity | undefined> {
    return this.repository.findById(this.database, id);
  }

  async remove(id: TId, options?: TransactionOptions): Promise<TEntity> {
    return this.executeMutation((executor) => this.repository.remove(executor, id), options);
  }

  async update(id: TId, input: TUpdateInput, options?: TransactionOptions): Promise<TEntity> {
    return this.executeMutation((executor) => this.repository.update(executor, id, input), options);
  }

  protected async executeMutation<TResult>(
    operation: (executor: DatabaseExecutor) => Promise<TResult>,
    options?: TransactionOptions,
  ): Promise<TResult> {
    if (options?.useTransaction === false) {
      return operation(this.database);
    }

    return this.database.transaction((transaction) => operation(transaction));
  }

  protected getDuplicateCreateMessage(input: TCreateInput): string {
    void input;

    return `Entity "${this.entityName}" with the same unique value already exists.`;
  }

  private throwCreateError(error: unknown, input: TCreateInput): never {
    if (hasPostgresErrorCode(error, PostgresErrorCode.UniqueViolation)) {
      throw new ConflictException(this.getDuplicateCreateMessage(input));
    }

    throw error;
  }
}
