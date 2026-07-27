import type {IDatabaseService} from './database.service';
import type {IBaseRepository} from './interfaces';
import type {DatabaseExecutor} from './types';

export abstract class BaseRepository<
  TEntity,
  TCreateInput,
  TUpdateInput,
  TCreateResult = TEntity,
  TId = string,
> implements IBaseRepository<TEntity, TCreateInput, TUpdateInput, TCreateResult, TId> {
  protected constructor(private readonly databaseService: IDatabaseService) {}

  abstract create(input: TCreateInput): Promise<TCreateResult>;
  abstract findAll(): Promise<readonly TEntity[]>;
  abstract findById(id: TId): Promise<TEntity | undefined>;
  abstract remove(id: TId): Promise<TEntity>;
  abstract update(id: TId, input: TUpdateInput): Promise<TEntity>;

  protected get database(): DatabaseExecutor {
    return this.databaseService.getExecutor();
  }
}
