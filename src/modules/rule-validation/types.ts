import type {RuleExpressionAstValidationDiagnostic} from './ast/types';
import type {ContextSchemaPathValidationDiagnostic} from './context/types';
import type {RuleExpressionParseDiagnostic} from './parser/types';
import type {RuleExpressionTypeValidationDiagnostic} from './type/types';

type RuleExpressionValidationDiagnostic =
  | ContextSchemaPathValidationDiagnostic
  | RuleExpressionAstValidationDiagnostic
  | RuleExpressionParseDiagnostic
  | RuleExpressionTypeValidationDiagnostic;

type RuleExpressionValidationFailure = {
  readonly diagnostic: RuleExpressionValidationDiagnostic;
  readonly isValid: false;
};

type RuleExpressionValidationResult =
  RuleExpressionValidationFailure | RuleExpressionValidationSuccess;

type RuleExpressionValidationSuccess = {
  readonly isValid: true;
};

export {
  type RuleExpressionValidationDiagnostic,
  type RuleExpressionValidationFailure,
  type RuleExpressionValidationResult,
  type RuleExpressionValidationSuccess,
};
