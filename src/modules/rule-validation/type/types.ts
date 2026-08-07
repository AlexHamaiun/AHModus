import type {ContextSchemaPathValidationDiagnostic} from '../context-schema-paths/types';
import {RuleExpressionTypeValidationDiagnosticCode, RuleExpressionValueType} from './enums';

type RuleExpressionInferredType = {
  readonly valueTypes: readonly RuleExpressionValueType[];
};

type RuleExpressionTypeValidationDiagnostic =
  | ContextSchemaPathValidationDiagnostic
  | {
      readonly code: RuleExpressionTypeValidationDiagnosticCode;
      readonly message: string;
    };

type RuleExpressionTypeValidationFailure = {
  readonly diagnostic: RuleExpressionTypeValidationDiagnostic;
  readonly isValid: false;
};

type RuleExpressionTypeValidationResult =
  RuleExpressionTypeValidationFailure | RuleExpressionTypeValidationSuccess;

type RuleExpressionTypeValidationSuccess = {
  readonly isValid: true;
};

type RuleExpressionTypeInferenceFailure = {
  readonly diagnostic: RuleExpressionTypeValidationDiagnostic;
  readonly isSuccess: false;
};

type RuleExpressionTypeInferenceResult =
  RuleExpressionTypeInferenceFailure | RuleExpressionTypeInferenceSuccess;

type RuleExpressionTypeInferenceSuccess = {
  readonly inferredType: RuleExpressionInferredType;
  readonly isSuccess: true;
};

export {
  type RuleExpressionInferredType,
  type RuleExpressionTypeInferenceFailure,
  type RuleExpressionTypeInferenceResult,
  type RuleExpressionTypeInferenceSuccess,
  type RuleExpressionTypeValidationDiagnostic,
  type RuleExpressionTypeValidationFailure,
  type RuleExpressionTypeValidationResult,
  type RuleExpressionTypeValidationSuccess,
};
