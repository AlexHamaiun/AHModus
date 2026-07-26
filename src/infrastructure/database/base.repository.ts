import {InternalServerErrorException} from '@nestjs/common';

import type {IBaseRepository} from './interfaces';
import type {DatabaseExecutor} from './types';

export abstract class BaseRepository<
  TEntity,
  TCreateInput,
  TUpdateInput,
  TCreateResult = TEntity,
  TId = string,
> implements IBaseRepository<TEntity, TCreateInput, TUpdateInput, TCreateResult, TId> {
  abstract create(executor: DatabaseExecutor, input: TCreateInput): Promise<TCreateResult>;
  abstract findAll(executor: DatabaseExecutor): Promise<readonly TEntity[]>;
  abstract findById(executor: DatabaseExecutor, id: TId): Promise<TEntity | undefined>;
  abstract remove(executor: DatabaseExecutor, id: TId): Promise<TEntity>;
  abstract update(executor: DatabaseExecutor, id: TId, input: TUpdateInput): Promise<TEntity>;

  protected getSingleResultOrThrow<TResult>(
    entities: readonly TResult[],
    entityName: string,
  ): TResult {
    if (entities.length !== 1) {
      throw new InternalServerErrorException(
        `Expected exactly one entity "${entityName}" from the database, received ${entities.length}.`,
      );
    }

    return entities[0]!;
  }
}
