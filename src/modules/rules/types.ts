import type {InferInsertModel, InferSelectModel} from 'drizzle-orm';

import type {rules, ruleVersions} from '../../infrastructure/database/schema';

type NewRule = InferInsertModel<typeof rules>;
type NewRuleVersion = InferInsertModel<typeof ruleVersions>;
type Rule = InferSelectModel<typeof rules>;
type RuleVersion = InferSelectModel<typeof ruleVersions>;

type CreateRuleInput = {
  readonly contextSchemaKey: string;
  readonly description?: string;
  readonly expression: string;
  readonly key: string;
  readonly name: string;
};

type CreateRuleVersionInput = {
  readonly contextSchemaKey: string;
  readonly expression: string;
};

type CreateRuleResolvedInput = Omit<CreateRuleInput, 'contextSchemaKey'> & {
  readonly contextSchemaVersionId: string;
};

type CreateRuleVersionResolvedInput = Omit<CreateRuleVersionInput, 'contextSchemaKey'> & {
  readonly contextSchemaVersionId: string;
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
  type CreateRuleResolvedInput,
  type CreateRuleVersionInput,
  type CreateRuleVersionResolvedInput,
  type NewRule,
  type NewRuleVersion,
  type Rule,
  type RuleDraft,
  type RuleVersion,
  type UpdateRuleInput,
};
