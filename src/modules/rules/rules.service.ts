import {Inject, Injectable} from '@nestjs/common';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';

import {Repository, Service} from '../../common/enums';
import type {IBaseService} from '../../common/interfaces';
import type {TransactionOptions} from '../../common/types';
import {BaseService} from '../../infrastructure/database/base.service';
import {RuleEntityName} from './enums';
import type {IRulesRepository} from './interfaces';
import type {CreateRuleInput, Rule, RuleDraft, UpdateRuleInput} from './types';

interface IRulesService extends IBaseService<Rule, CreateRuleInput, UpdateRuleInput, RuleDraft> {
  create(input: CreateRuleInput, options?: TransactionOptions): Promise<RuleDraft>;
}

@Injectable()
class RulesService
  extends BaseService<Rule, CreateRuleInput, UpdateRuleInput, RuleDraft>
  implements IRulesService
{
  constructor(
    @Inject(Service.Drizzle) database: NodePgDatabase,
    @Inject(Repository.Rules) rulesRepository: IRulesRepository,
  ) {
    super(database, rulesRepository, RuleEntityName.Rule);
  }

  protected override getDuplicateCreateMessage(createRuleInput: CreateRuleInput): string {
    return `Entity "${RuleEntityName.Rule}" with key "${createRuleInput.key}" already exists.`;
  }
}

export {type IRulesService, RulesService};
