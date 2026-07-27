import {Inject, Injectable} from '@nestjs/common';
import {and, asc, eq, isNull} from 'drizzle-orm';

import {Service} from '../../common/enums';
import {DatabaseAssertions} from '../../infrastructure/database/assertions/database.assertions';
import {BaseRepository} from '../../infrastructure/database/base.repository';
import type {IDatabaseService} from '../../infrastructure/database/database.service';
import type {IBaseRepository} from '../../infrastructure/database/interfaces';
import {rules, ruleVersions} from '../../infrastructure/database/schema';
import {RuleEntityName} from './enums';
import type {CreateRuleInput, Rule, RuleDraft, UpdateRuleInput} from './types';

interface IRulesRepository extends IBaseRepository<
  Rule,
  CreateRuleInput,
  UpdateRuleInput,
  RuleDraft
> {
  findByKey(key: string): Promise<Rule | undefined>;
}

@Injectable()
class RulesRepository
  extends BaseRepository<Rule, CreateRuleInput, UpdateRuleInput, RuleDraft>
  implements IRulesRepository
{
  constructor(@Inject(Service.Database) databaseService: IDatabaseService) {
    super(databaseService);
  }

  async create(input: CreateRuleInput): Promise<RuleDraft> {
    const insertedRules = await this.database
      .insert(rules)
      .values({
        description: input.description,
        key: input.key,
        name: input.name,
      })
      .returning();
    const rule = DatabaseAssertions.requireSingleResult(insertedRules, RuleEntityName.Rule);

    const insertedRuleVersions = await this.database
      .insert(ruleVersions)
      .values({
        expression: input.expression,
        ruleId: rule.id,
        version: 1,
      })
      .returning();
    const version = DatabaseAssertions.requireSingleResult(
      insertedRuleVersions,
      RuleEntityName.RuleVersion,
    );

    return {rule, version};
  }

  async findAll(): Promise<readonly Rule[]> {
    return this.database
      .select()
      .from(rules)
      .where(isNull(rules.archivedAt))
      .orderBy(asc(rules.createdAt));
  }

  async findById(id: string): Promise<Rule | undefined> {
    const [rule] = await this.database
      .select()
      .from(rules)
      .where(and(eq(rules.id, id), isNull(rules.archivedAt)));

    return rule;
  }

  async findByKey(key: string): Promise<Rule | undefined> {
    const [rule] = await this.database
      .select()
      .from(rules)
      .where(and(eq(rules.key, key), isNull(rules.archivedAt)));

    return rule;
  }

  async remove(id: string): Promise<Rule> {
    const archivedRules = await this.database
      .update(rules)
      .set({
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(rules.id, id), isNull(rules.archivedAt)))
      .returning();

    return DatabaseAssertions.requireSingleResult(archivedRules, RuleEntityName.Rule);
  }

  async update(id: string, input: UpdateRuleInput): Promise<Rule> {
    const updatedRules = await this.database
      .update(rules)
      .set({
        description: input.description,
        name: input.name,
        updatedAt: new Date(),
      })
      .where(and(eq(rules.id, id), isNull(rules.archivedAt)))
      .returning();

    return DatabaseAssertions.requireSingleResult(updatedRules, RuleEntityName.Rule);
  }
}

export {type IRulesRepository, RulesRepository};
