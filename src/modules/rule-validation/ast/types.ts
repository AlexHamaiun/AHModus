import type {RuleExpressionAst} from '../parser/types';
import {RuleExpressionAstValidationDiagnosticCode} from './enums';

type RuleExpressionAstValidationDiagnostic = {
  readonly code: RuleExpressionAstValidationDiagnosticCode;
  readonly message: string;
};

type RuleExpressionAstValidationFailure = {
  readonly diagnostic: RuleExpressionAstValidationDiagnostic;
  readonly isValid: false;
};

type RuleExpressionAstValidationResult =
  RuleExpressionAstValidationFailure | RuleExpressionAstValidationSuccess;

type RuleExpressionAstValidationState = {
  nodeCount: number;
};

type RuleExpressionAstValidationSuccess = {
  readonly isValid: true;
};

export {
  type RuleExpressionAst,
  type RuleExpressionAstValidationDiagnostic,
  type RuleExpressionAstValidationFailure,
  type RuleExpressionAstValidationResult,
  type RuleExpressionAstValidationState,
  type RuleExpressionAstValidationSuccess,
};
