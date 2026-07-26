import type {DatabaseExecutor} from './types';

interface IPostgresError {
  readonly code: string;
}

interface IBaseRepository<
  TEntity,
  TCreateInput,
  TUpdateInput,
  TCreateResult = TEntity,
  TId = string,
> {
  create(executor: DatabaseExecutor, input: TCreateInput): Promise<TCreateResult>;
  findAll(executor: DatabaseExecutor): Promise<readonly TEntity[]>;
  findById(executor: DatabaseExecutor, id: TId): Promise<TEntity | undefined>;
  remove(executor: DatabaseExecutor, id: TId): Promise<TEntity>;
  update(executor: DatabaseExecutor, id: TId, input: TUpdateInput): Promise<TEntity>;
}

export {type IBaseRepository, type IPostgresError};
