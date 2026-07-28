import {Inject, Injectable} from '@nestjs/common';

import {EntityAssertions} from '../../common/assertions/entity.assertions';
import {Repository, Service} from '../../common/enums';
import type {IBaseService} from '../../common/interfaces';
import type {TransactionOptions} from '../../common/types';
import {BaseService} from '../../infrastructure/database/base.service';
import type {IDatabaseService} from '../../infrastructure/database/database.service';
import {RuleEntityName} from './enums';
import type {IRulesRepository} from './rules.repository';
import type {
  CreateRuleInput,
  CreateRuleVersionInput,
  Rule,
  RuleDraft,
  RuleVersion,
  UpdateRuleInput,
} from './types';

interface IRulesService extends IBaseService<Rule, CreateRuleInput, UpdateRuleInput, RuleDraft> {
  create(input: CreateRuleInput, options?: TransactionOptions): Promise<RuleDraft>;
  createVersionByRuleKey(key: string, input: CreateRuleVersionInput): Promise<RuleVersion>;
  findByKey(key: string): Promise<Rule>;
  findVersionsByRuleKey(key: string): Promise<readonly RuleVersion[]>;
}

@Injectable()
class RulesService
  extends BaseService<Rule, CreateRuleInput, UpdateRuleInput, RuleDraft>
  implements IRulesService
{
  constructor(
    @Inject(Service.Database) databaseService: IDatabaseService,
    @Inject(Repository.Rules) private readonly rulesRepository: IRulesRepository,
  ) {
    super(databaseService, rulesRepository, RuleEntityName.Rule);
  }

  async findByKey(key: string): Promise<Rule> {
    const rule = await this.rulesRepository.findByKey(key);

    return EntityAssertions.require(rule, RuleEntityName.Rule, 'key', key);
  }

  async createVersionByRuleKey(key: string, input: CreateRuleVersionInput): Promise<RuleVersion> {
    return this.executeMutation(async () => {
      const rule = EntityAssertions.require(
        await this.rulesRepository.findByKeyForUpdate(key),
        RuleEntityName.Rule,
        'key',
        key,
      );

      return this.rulesRepository.createNextVersion(rule.id, input);
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
