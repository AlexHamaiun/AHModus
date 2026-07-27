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
  create(input: TCreateInput): Promise<TCreateResult>;
  findAll(): Promise<readonly TEntity[]>;
  findById(id: TId): Promise<TEntity | undefined>;
  remove(id: TId): Promise<TEntity>;
  update(id: TId, input: TUpdateInput): Promise<TEntity>;
}

export {type IBaseRepository, type IPostgresError};
