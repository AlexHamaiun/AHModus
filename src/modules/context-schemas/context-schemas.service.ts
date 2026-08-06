import {BadRequestException, Inject, Injectable} from '@nestjs/common';

import {EntityAssertions} from '../../common/assertions/entity.assertions';
import {Repository, Service} from '../../common/enums';
import type {IBaseService} from '../../common/interfaces';
import type {TransactionOptions} from '../../common/types';
import {BaseService} from '../../infrastructure/database/base.service';
import type {IDatabaseService} from '../../infrastructure/database/database.service';
import {ContextSchemaEntityName} from './enums';
import type {IContextSchemasRepository} from './context-schemas.repository';
import type {IContextSchemaValidatorService} from './context-schema-validator.service';
import type {
  ContextSchema,
  ContextSchemaDraft,
  ContextSchemaVersion,
  CreateContextSchemaInput,
  UpdateContextSchemaInput,
} from './types';

interface IContextSchemasService extends IBaseService<
  ContextSchema,
  CreateContextSchemaInput,
  UpdateContextSchemaInput,
  ContextSchemaDraft
> {
  create(
    input: CreateContextSchemaInput,
    options?: TransactionOptions,
  ): Promise<ContextSchemaDraft>;
  findByKey(key: string): Promise<ContextSchema>;
  findVersionsByContextSchemaKey(key: string): Promise<readonly ContextSchemaVersion[]>;
}

@Injectable()
class ContextSchemasService
  extends BaseService<
    ContextSchema,
    CreateContextSchemaInput,
    UpdateContextSchemaInput,
    ContextSchemaDraft
  >
  implements IContextSchemasService
{
  constructor(
    @Inject(Service.Database) databaseService: IDatabaseService,
    @Inject(Repository.ContextSchemas)
    private readonly contextSchemasRepository: IContextSchemasRepository,
    @Inject(Service.ContextSchemaValidator)
    private readonly contextSchemaValidatorService: IContextSchemaValidatorService,
  ) {
    super(databaseService, contextSchemasRepository, ContextSchemaEntityName.ContextSchema);
  }

  override async create(
    input: CreateContextSchemaInput,
    options?: TransactionOptions,
  ): Promise<ContextSchemaDraft> {
    const validationResult = this.contextSchemaValidatorService.validate(input.definition);

    if (!validationResult.isValid) {
      throw new BadRequestException({
        code: validationResult.diagnostic.code,
        message: validationResult.diagnostic.message,
      });
    }

    return super.create(input, options);
  }

  async findByKey(key: string): Promise<ContextSchema> {
    const contextSchema = await this.contextSchemasRepository.findByKey(key);

    return EntityAssertions.require(
      contextSchema,
      ContextSchemaEntityName.ContextSchema,
      'key',
      key,
    );
  }

  async findVersionsByContextSchemaKey(key: string): Promise<readonly ContextSchemaVersion[]> {
    const contextSchema = await this.findByKey(key);

    return this.contextSchemasRepository.findVersionsByContextSchemaId(contextSchema.id);
  }

  protected override getDuplicateCreateMessage(
    createContextSchemaInput: CreateContextSchemaInput,
  ): string {
    return `Entity "${ContextSchemaEntityName.ContextSchema}" with key "${createContextSchemaInput.key}" already exists.`;
  }
}

export {type IContextSchemasService, ContextSchemasService};
