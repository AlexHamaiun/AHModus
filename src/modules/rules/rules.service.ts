import {Inject, Injectable} from '@nestjs/common';

import {EntityAssertions} from '../../common/assertions/entity.assertions';
import {Repository, Service} from '../../common/enums';
import type {IBaseService} from '../../common/interfaces';
import {BaseService} from '../../infrastructure/database/base.service';
import type {IDatabaseService} from '../../infrastructure/database/database.service';
import type {IContextSchemasService} from '../context-schemas/context-schemas.service';
import {RuleEntityName} from './enums';
import type {IRulesRepository} from './rules.repository';
import type {IRuleVersionsRepository} from './rule-versions.repository';
import type {
  CreateRuleByContextSchemaInput,
  CreateRuleInput,
  CreateRuleVersionByContextSchemaInput,
  CreateRuleVersionInput,
  Rule,
  RuleDraft,
  RuleVersion,
  UpdateRuleInput,
} from './types';

interface IRulesService extends IBaseService<Rule, CreateRuleInput, UpdateRuleInput> {
  createByContextSchema(input: CreateRuleByContextSchemaInput): Promise<RuleDraft>;
  createVersionByRuleKey(
    key: string,
    input: CreateRuleVersionByContextSchemaInput,
  ): Promise<RuleVersion>;
  findByKey(key: string): Promise<Rule>;
  findVersionsByRuleKey(key: string): Promise<readonly RuleVersion[]>;
}

@Injectable()
class RulesService
  extends BaseService<Rule, CreateRuleInput, UpdateRuleInput>
  implements IRulesService
{
  constructor(
    @Inject(Service.Database) databaseService: IDatabaseService,
    @Inject(Repository.Rules) private readonly rulesRepository: IRulesRepository,
    @Inject(Repository.RuleVersions)
    private readonly ruleVersionsRepository: IRuleVersionsRepository,
    @Inject(Service.ContextSchemas)
    private readonly contextSchemasService: IContextSchemasService,
  ) {
    super(databaseService, rulesRepository, RuleEntityName.Rule);
  }

  async findByKey(key: string): Promise<Rule> {
    const rule = await this.rulesRepository.findByKey(key);

    return EntityAssertions.require(rule, RuleEntityName.Rule, 'key', key);
  }

  async createByContextSchema(input: CreateRuleByContextSchemaInput): Promise<RuleDraft> {
    return this.executeMutation(async () => {
      const contextSchemaVersion = await this.contextSchemasService.findActiveVersionByKey(
        input.contextSchemaKey,
      );

      const rule = await super.create({
        description: input.description,
        key: input.key,
        name: input.name,
      });

      const createRuleVersionInput: CreateRuleVersionInput = {
        contextSchemaVersionId: contextSchemaVersion.id,
        expression: input.expression,
      };

      const version = await this.ruleVersionsRepository.createNextVersion(
        rule.id,
        createRuleVersionInput,
      );

      return {rule, version};
    });
  }

  async createVersionByRuleKey(
    key: string,
    input: CreateRuleVersionByContextSchemaInput,
  ): Promise<RuleVersion> {
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
      const createRuleVersionInput: CreateRuleVersionInput = {
        contextSchemaVersionId: contextSchemaVersion.id,
        expression: input.expression,
      };

      return this.ruleVersionsRepository.createNextVersion(rule.id, createRuleVersionInput);
    });
  }

  async findVersionsByRuleKey(key: string): Promise<readonly RuleVersion[]> {
    const rule = await this.findByKey(key);

    return this.ruleVersionsRepository.findByRuleId(rule.id);
  }

  protected override getDuplicateCreateMessage(createRuleInput: CreateRuleInput): string {
    return `Entity "${RuleEntityName.Rule}" with key "${createRuleInput.key}" already exists.`;
  }
}

export {type IRulesService, RulesService};
