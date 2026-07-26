import type {TransactionOptions} from './types';

interface IBaseService<TEntity, TCreateInput, TUpdateInput, TCreateResult = TEntity, TId = string> {
  create(input: TCreateInput, options?: TransactionOptions): Promise<TCreateResult>;
  findAll(): Promise<readonly TEntity[]>;
  findById(id: TId): Promise<TEntity | undefined>;
  remove(id: TId, options?: TransactionOptions): Promise<TEntity>;
  update(id: TId, input: TUpdateInput, options?: TransactionOptions): Promise<TEntity>;
}

export {type IBaseService};
