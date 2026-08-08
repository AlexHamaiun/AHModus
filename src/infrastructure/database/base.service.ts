import type {IBaseService} from '../../common/interfaces';
import type {TransactionOptions} from '../../common/types';
import {PostgresErrorTranslator} from './postgres-error.translator';
import type {IDatabaseService} from './database.service';
import type {IBaseRepository} from './interfaces';

abstract class BaseService<
  TEntity,
  TCreateInput,
  TUpdateInput,
  TCreateResult = TEntity,
  TId = string,
> implements IBaseService<TEntity, TCreateInput, TUpdateInput, TCreateResult, TId> {
  protected constructor(
    private readonly databaseService: IDatabaseService,
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
      return await this.executeMutation(() => this.repository.create(input), options);
    } catch (error: unknown) {
      PostgresErrorTranslator.rethrowCreateError(error, this.getDuplicateCreateMessage(input));
    }
  }

  async findAll(): Promise<readonly TEntity[]> {
    return this.repository.findAll();
  }

  async findById(id: TId): Promise<TEntity | undefined> {
    return this.repository.findById(id);
  }

  async remove(id: TId, options?: TransactionOptions): Promise<TEntity> {
    return this.executeMutation(() => this.repository.remove(id), options);
  }

  async update(id: TId, input: TUpdateInput, options?: TransactionOptions): Promise<TEntity> {
    return this.executeMutation(() => this.repository.update(id, input), options);
  }

  protected async executeMutation<TResult>(
    operation: () => Promise<TResult>,
    options?: TransactionOptions,
  ): Promise<TResult> {
    if (options?.useTransaction === false) {
      return operation();
    }

    return this.databaseService.executeInTransaction(operation);
  }

  protected getDuplicateCreateMessage(input: TCreateInput): string {
    void input;

    return `Entity "${this.entityName}" with the same unique value already exists.`;
  }
}

export {BaseService};
