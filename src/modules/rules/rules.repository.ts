import {Injectable} from '@nestjs/common';
import {and, asc, eq, isNull} from 'drizzle-orm';

import {BaseRepository} from '../../infrastructure/database/base.repository';
import {rules, ruleVersions} from '../../infrastructure/database/schema';
import type {DatabaseExecutor} from '../../infrastructure/database/types';
import type {IRulesRepository} from './interfaces';
import {RuleEntityName} from './enums';
import type {CreateRuleInput, Rule, RuleDraft, UpdateRuleInput} from './types';

@Injectable()
export class RulesRepository
  extends BaseRepository<Rule, CreateRuleInput, UpdateRuleInput, RuleDraft>
  implements IRulesRepository
{
  async create(executor: DatabaseExecutor, input: CreateRuleInput): Promise<RuleDraft> {
    const insertedRules = await executor
      .insert(rules)
      .values({
        description: input.description,
        key: input.key,
        name: input.name,
      })
      .returning();
    const rule = this.getSingleResultOrThrow(insertedRules, RuleEntityName.Rule);

    const insertedRuleVersions = await executor
      .insert(ruleVersions)
      .values({
        expression: input.expression,
        ruleId: rule.id,
        version: 1,
      })
      .returning();
    const version = this.getSingleResultOrThrow(insertedRuleVersions, RuleEntityName.RuleVersion);

    return {rule, version};
  }

  async findAll(executor: DatabaseExecutor): Promise<readonly Rule[]> {
    return executor
      .select()
      .from(rules)
      .where(isNull(rules.archivedAt))
      .orderBy(asc(rules.createdAt));
  }

  async findById(executor: DatabaseExecutor, id: string): Promise<Rule | undefined> {
    const [rule] = await executor
      .select()
      .from(rules)
      .where(and(eq(rules.id, id), isNull(rules.archivedAt)));

    return rule;
  }

  async remove(executor: DatabaseExecutor, id: string): Promise<Rule> {
    const archivedRules = await executor
      .update(rules)
      .set({
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(rules.id, id), isNull(rules.archivedAt)))
      .returning();

    return this.getSingleResultOrThrow(archivedRules, RuleEntityName.Rule);
  }

  async update(executor: DatabaseExecutor, id: string, input: UpdateRuleInput): Promise<Rule> {
    const updatedRules = await executor
      .update(rules)
      .set({
        description: input.description,
        name: input.name,
        updatedAt: new Date(),
      })
      .where(and(eq(rules.id, id), isNull(rules.archivedAt)))
      .returning();

    return this.getSingleResultOrThrow(updatedRules, RuleEntityName.Rule);
  }
}
