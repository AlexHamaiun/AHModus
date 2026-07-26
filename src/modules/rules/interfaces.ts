import type {IBaseRepository} from '../../infrastructure/database/interfaces';
import type {DatabaseExecutor} from '../../infrastructure/database/types';
import type {CreateRuleInput, Rule, RuleDraft, UpdateRuleInput} from './types';

interface IRuleVersionValidationDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly path?: readonly string[];
}

interface IRuleVersionValidationResult {
  readonly diagnostics: readonly IRuleVersionValidationDiagnostic[];
  readonly isValid: boolean;
}

interface IRulesRepository extends IBaseRepository<
  Rule,
  CreateRuleInput,
  UpdateRuleInput,
  RuleDraft
> {
  create(executor: DatabaseExecutor, input: CreateRuleInput): Promise<RuleDraft>;
}

export {
  type IRuleVersionValidationDiagnostic,
  type IRuleVersionValidationResult,
  type IRulesRepository,
};
