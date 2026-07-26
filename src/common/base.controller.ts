import type {IBaseService} from './interfaces';
import type {TransactionOptions} from './types';

export abstract class BaseController<
  TEntity,
  TCreateInput,
  TUpdateInput,
  TCreateResult = TEntity,
  TId = string,
> {
  protected constructor(
    private readonly baseService: IBaseService<
      TEntity,
      TCreateInput,
      TUpdateInput,
      TCreateResult,
      TId
    >,
  ) {}

  protected create(input: TCreateInput, options?: TransactionOptions): Promise<TCreateResult> {
    return this.baseService.create(input, options);
  }

  protected findAll(): Promise<readonly TEntity[]> {
    return this.baseService.findAll();
  }

  protected findById(id: TId): Promise<TEntity | undefined> {
    return this.baseService.findById(id);
  }

  protected remove(id: TId, options?: TransactionOptions): Promise<TEntity> {
    return this.baseService.remove(id, options);
  }

  protected update(id: TId, input: TUpdateInput, options?: TransactionOptions): Promise<TEntity> {
    return this.baseService.update(id, input, options);
  }
}
