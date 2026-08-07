import {Inject, Injectable} from '@nestjs/common';
import {and, asc, desc, eq, isNull} from 'drizzle-orm';

import {Service} from '../../common/enums';
import {DatabaseAssertions} from '../../infrastructure/database/assertions/database.assertions';
import {BaseRepository} from '../../infrastructure/database/base.repository';
import type {IDatabaseService} from '../../infrastructure/database/database.service';
import type {IBaseRepository} from '../../infrastructure/database/interfaces';
import {rules, ruleVersions} from '../../infrastructure/database/schema';
import {RuleEntityName} from './enums';
import type {
  CreateRuleResolvedInput,
  CreateRuleVersionResolvedInput,
  Rule,
  RuleDraft,
  RuleVersion,
  UpdateRuleInput,
} from './types';

interface IRulesRepository extends IBaseRepository<
  Rule,
  CreateRuleResolvedInput,
  UpdateRuleInput,
  RuleDraft
> {
  createNextVersion(ruleId: string, input: CreateRuleVersionResolvedInput): Promise<RuleVersion>;
  findByKey(key: string): Promise<Rule | undefined>;
  findByKeyForUpdate(key: string): Promise<Rule | undefined>;
  findVersionsByRuleId(ruleId: string): Promise<readonly RuleVersion[]>;
}

@Injectable()
class RulesRepository
  extends BaseRepository<Rule, CreateRuleResolvedInput, UpdateRuleInput, RuleDraft>
  implements IRulesRepository
{
  constructor(@Inject(Service.Database) databaseService: IDatabaseService) {
    super(databaseService);
  }

  async create(input: CreateRuleResolvedInput): Promise<RuleDraft> {
    const insertedRules = await this.database
      .insert(rules)
      .values({
        description: input.description,
        key: input.key,
        name: input.name,
      })
      .returning();
    const rule = DatabaseAssertions.requireSingleResult(insertedRules, RuleEntityName.Rule);

    const version = await this.createNextVersion(rule.id, {
      contextSchemaVersionId: input.contextSchemaVersionId,
      expression: input.expression,
    });

    return {rule, version};
  }

  async createNextVersion(
    ruleId: string,
    input: CreateRuleVersionResolvedInput,
  ): Promise<RuleVersion> {
    const [latestVersion] = await this.database
      .select({version: ruleVersions.version})
      .from(ruleVersions)
      .where(eq(ruleVersions.ruleId, ruleId))
      .orderBy(desc(ruleVersions.version))
      .limit(1);
    const nextVersion = latestVersion === undefined ? 1 : latestVersion.version + 1;

    const insertedRuleVersions = await this.database
      .insert(ruleVersions)
      .values({
        contextSchemaVersionId: input.contextSchemaVersionId,
        expression: input.expression,
        ruleId,
        version: nextVersion,
      })
      .returning();

    return DatabaseAssertions.requireSingleResult(insertedRuleVersions, RuleEntityName.RuleVersion);
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

  async findByKeyForUpdate(key: string): Promise<Rule | undefined> {
    const [rule] = await this.database
      .select()
      .from(rules)
      .where(and(eq(rules.key, key), isNull(rules.archivedAt)))
      .for('update');

    return rule;
  }

  async findVersionsByRuleId(ruleId: string): Promise<readonly RuleVersion[]> {
    return this.database
      .select()
      .from(ruleVersions)
      .where(eq(ruleVersions.ruleId, ruleId))
      .orderBy(asc(ruleVersions.version));
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
