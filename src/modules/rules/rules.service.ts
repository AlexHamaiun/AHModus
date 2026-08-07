import {Inject, Injectable} from '@nestjs/common';

import {EntityAssertions} from '../../common/assertions/entity.assertions';
import {Repository, Service} from '../../common/enums';
import type {IBaseService} from '../../common/interfaces';
import type {TransactionOptions} from '../../common/types';
import {BaseService} from '../../infrastructure/database/base.service';
import type {IDatabaseService} from '../../infrastructure/database/database.service';
import type {IContextSchemasService} from '../context-schemas/context-schemas.service';
import {RuleEntityName} from './enums';
import type {IRulesRepository} from './rules.repository';
import type {
  CreateRuleInput,
  CreateRuleResolvedInput,
  CreateRuleVersionInput,
  CreateRuleVersionResolvedInput,
  Rule,
  RuleDraft,
  RuleVersion,
  UpdateRuleInput,
} from './types';

interface IRulesService extends IBaseService<Rule, CreateRuleInput, UpdateRuleInput, RuleDraft> {
  createRuleByContextSchema(input: CreateRuleInput): Promise<RuleDraft>;
  createVersionByRuleKey(key: string, input: CreateRuleVersionInput): Promise<RuleVersion>;
  findByKey(key: string): Promise<Rule>;
  findVersionsByRuleKey(key: string): Promise<readonly RuleVersion[]>;
}

@Injectable()
class RulesService
  extends BaseService<
    Rule,
    CreateRuleInput,
    UpdateRuleInput,
    RuleDraft,
    string,
    CreateRuleResolvedInput
  >
  implements IRulesService
{
  constructor(
    @Inject(Service.Database) databaseService: IDatabaseService,
    @Inject(Repository.Rules) private readonly rulesRepository: IRulesRepository,
    @Inject(Service.ContextSchemas)
    private readonly contextSchemasService: IContextSchemasService,
  ) {
    super(databaseService, rulesRepository, RuleEntityName.Rule);
  }

  async findByKey(key: string): Promise<Rule> {
    const rule = await this.rulesRepository.findByKey(key);

    return EntityAssertions.require(rule, RuleEntityName.Rule, 'key', key);
  }

  override async create(input: CreateRuleInput, options?: TransactionOptions): Promise<RuleDraft> {
    return this.createRuleByContextSchema(input, options);
  }

  async createRuleByContextSchema(
    input: CreateRuleInput,
    options?: TransactionOptions,
  ): Promise<RuleDraft> {
    try {
      return await this.executeMutation(async () => {
        const contextSchemaVersion = await this.contextSchemasService.findActiveVersionByKey(
          input.contextSchemaKey,
        );
        const createRuleInput: CreateRuleResolvedInput = {
          contextSchemaVersionId: contextSchemaVersion.id,
          description: input.description,
          expression: input.expression,
          key: input.key,
          name: input.name,
        };

        return this.rulesRepository.create(createRuleInput);
      }, options);
    } catch (error: unknown) {
      this.throwCreateError(error, input);
    }
  }

  async createVersionByRuleKey(key: string, input: CreateRuleVersionInput): Promise<RuleVersion> {
    return this.executeMutation(async () => {
      const rule = EntityAssertions.require(
        await this.rulesRepository.findByKeyForUpdate(key),
        RuleEntityName.Rule,
        'key',
        key,
      );
      const contextSchemaVersion = await this.contextSchemasService.findActiveVersionByKey(
        input.contextSchemaKey,
      );

      const createRuleVersionInput: CreateRuleVersionResolvedInput = {
        contextSchemaVersionId: contextSchemaVersion.id,
        expression: input.expression,
      };

      return this.rulesRepository.createNextVersion(rule.id, createRuleVersionInput);
    });
  }

  async findVersionsByRuleKey(key: string): Promise<readonly RuleVersion[]> {
    const rule = await this.findByKey(key);

    return this.rulesRepository.findVersionsByRuleId(rule.id);
  }

  protected override getDuplicateCreateMessage(createRuleInput: CreateRuleInput): string {
    return `Entity "${RuleEntityName.Rule}" with key "${createRuleInput.key}" already exists.`;
  }
}

export {type IRulesService, RulesService};
