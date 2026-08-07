import type {ContextSchemaNode} from '../../context-schemas/types';

import type {ContextSchemaPathValidationDiagnosticCode} from './enums';

type ContextSchemaPath = readonly string[];

type ContextSchemaPathValidationDiagnostic = {
  readonly code: ContextSchemaPathValidationDiagnosticCode;
  readonly message: string;
};

type ContextSchemaPathValidationFailure = {
  readonly diagnostic: ContextSchemaPathValidationDiagnostic;
  readonly isValid: false;
};

type ContextSchemaPathValidationResult =
  ContextSchemaPathValidationFailure | ContextSchemaPathValidationSuccess;

type ContextSchemaPathValidationSuccess = {
  readonly isValid: true;
};

type ContextSchemaPathResolutionFailure = {
  readonly diagnostic: ContextSchemaPathValidationDiagnostic;
  readonly isSuccess: false;
};

type ContextSchemaPathResolutionResult =
  ContextSchemaPathResolutionFailure | ContextSchemaPathResolutionSuccess;

type ContextSchemaPathResolutionSuccess = {
  readonly contextPath: ContextSchemaPath;
  readonly isSuccess: true;
  readonly node: ContextSchemaNode;
};

export {
  type ContextSchemaPath,
  type ContextSchemaPathResolutionFailure,
  type ContextSchemaPathResolutionResult,
  type ContextSchemaPathResolutionSuccess,
  type ContextSchemaPathValidationDiagnostic,
  type ContextSchemaPathValidationFailure,
  type ContextSchemaPathValidationResult,
  type ContextSchemaPathValidationSuccess,
};
