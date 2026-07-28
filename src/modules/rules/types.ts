import type {InferInsertModel, InferSelectModel} from 'drizzle-orm';

import type {rules, ruleVersions} from '../../infrastructure/database/schema';

type NewRule = InferInsertModel<typeof rules>;
type NewRuleVersion = InferInsertModel<typeof ruleVersions>;
type Rule = InferSelectModel<typeof rules>;
type RuleVersion = InferSelectModel<typeof ruleVersions>;

type CreateRuleInput = {
  readonly description?: string;
  readonly expression: string;
  readonly key: string;
  readonly name: string;
};

type CreateRuleVersionInput = {
  readonly expression: string;
};

type RuleDraft = {
  readonly rule: Rule;
  readonly version: RuleVersion;
};

type UpdateRuleInput = {
  readonly description?: string | null;
  readonly name?: string;
};

export {
  type CreateRuleInput,
  type CreateRuleVersionInput,
  type NewRule,
  type NewRuleVersion,
  type Rule,
  type RuleDraft,
  type RuleVersion,
  type UpdateRuleInput,
};
