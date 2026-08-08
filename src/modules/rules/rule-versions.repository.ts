import {Inject, Injectable} from '@nestjs/common';
import {asc, desc, eq} from 'drizzle-orm';

import {Service} from '../../common/enums';
import {DatabaseAssertions} from '../../infrastructure/database/assertions/database.assertions';
import type {IDatabaseService} from '../../infrastructure/database/database.service';
import {ruleVersions} from '../../infrastructure/database/schema';
import type {DatabaseExecutor} from '../../infrastructure/database/types';
import {RuleEntityName} from './enums';
import type {CreateRuleVersionInput, RuleVersion} from './types';

interface IRuleVersionsRepository {
  createNextVersion(ruleId: string, input: CreateRuleVersionInput): Promise<RuleVersion>;
  findByRuleId(ruleId: string): Promise<readonly RuleVersion[]>;
}

@Injectable()
class RuleVersionsRepository implements IRuleVersionsRepository {
  constructor(@Inject(Service.Database) private readonly databaseService: IDatabaseService) {}

  async createNextVersion(ruleId: string, input: CreateRuleVersionInput): Promise<RuleVersion> {
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

  async findByRuleId(ruleId: string): Promise<readonly RuleVersion[]> {
    return this.database
      .select()
      .from(ruleVersions)
      .where(eq(ruleVersions.ruleId, ruleId))
      .orderBy(asc(ruleVersions.version));
  }

  private get database(): DatabaseExecutor {
    return this.databaseService.getExecutor();
  }
}

export {type IRuleVersionsRepository, RuleVersionsRepository};
