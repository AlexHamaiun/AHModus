import {BadRequestException, Inject, Injectable} from '@nestjs/common';

import {EntityAssertions} from '../../common/assertions/entity.assertions';
import {Repository, Service} from '../../common/enums';
import type {IBaseService} from '../../common/interfaces';
import type {TransactionOptions} from '../../common/types';
import {BaseService} from '../../infrastructure/database/base.service';
import type {IDatabaseService} from '../../infrastructure/database/database.service';
import {ContextSchemaEntityName} from './enums';
import type {IContextSchemasRepository} from './context-schemas.repository';
import type {IContextSchemaDefinitionValidatorService} from './context-schema-definition-validator.service';
import type {
  ContextSchema,
  ContextSchemaDefinition,
  ContextSchemaDraft,
  ContextSchemaVersion,
  CreateContextSchemaInput,
  CreateContextSchemaVersionInput,
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
  createVersionByContextSchemaKey(
    key: string,
    input: CreateContextSchemaVersionInput,
  ): Promise<ContextSchemaVersion>;
  findActiveVersionByKey(key: string): Promise<ContextSchemaVersion>;
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
    @Inject(Service.ContextSchemaDefinitionValidator)
    private readonly contextSchemaDefinitionValidatorService: IContextSchemaDefinitionValidatorService,
  ) {
    super(databaseService, contextSchemasRepository, ContextSchemaEntityName.ContextSchema);
  }

  override async create(
    input: CreateContextSchemaInput,
    options?: TransactionOptions,
  ): Promise<ContextSchemaDraft> {
    this.validateDefinition(input.definition);

    return super.create(input, options);
  }

  async createVersionByContextSchemaKey(
    key: string,
    input: CreateContextSchemaVersionInput,
  ): Promise<ContextSchemaVersion> {
    this.validateDefinition(input.definition);

    return this.executeMutation(async () => {
      const contextSchema = EntityAssertions.require(
        await this.contextSchemasRepository.findByKeyForUpdate(key),
        ContextSchemaEntityName.ContextSchema,
        'key',
        key,
      );
      const version = await this.contextSchemasRepository.createNextVersion(
        contextSchema.id,
        input,
      );
      await this.contextSchemasRepository.activateVersion(contextSchema.id, version.id);

      return version;
    });
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

  async findActiveVersionByKey(key: string): Promise<ContextSchemaVersion> {
    const contextSchema = await this.findByKey(key);
    const contextSchemaVersion =
      await this.contextSchemasRepository.findActiveVersionByContextSchemaId(contextSchema.id);

    return EntityAssertions.require(
      contextSchemaVersion,
      ContextSchemaEntityName.ContextSchemaVersion,
      'context schema key',
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

  private validateDefinition(definition: unknown): asserts definition is ContextSchemaDefinition {
    const validationResult = this.contextSchemaDefinitionValidatorService.validate(definition);

    if (!validationResult.isValid) {
      throw new BadRequestException({
        code: validationResult.diagnostic.code,
        message: validationResult.diagnostic.message,
      });
    }
  }
}

export {type IContextSchemasService, ContextSchemasService};
