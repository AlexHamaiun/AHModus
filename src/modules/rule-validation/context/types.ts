import {
  ContextSchemaNodeKind,
  ContextSchemaPathValidationDiagnosticCode,
  ContextSchemaValueType,
} from './enums';

type ContextSchema = ContextSchemaObjectNode;

type ContextSchemaNode = ContextSchemaObjectNode | ContextSchemaValueNode;

type ContextSchemaNodeOptions = {
  readonly nullable?: boolean;
  readonly optional?: boolean;
};

type ContextSchemaObjectNode = ContextSchemaNodeOptions & {
  readonly kind: ContextSchemaNodeKind.Object;
  readonly properties: Readonly<Record<string, ContextSchemaNode>>;
};

type ContextSchemaValueNode = ContextSchemaNodeOptions & {
  readonly kind: ContextSchemaNodeKind.Value;
  readonly valueType: ContextSchemaValueType;
};

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

export {
  type ContextSchema,
  type ContextSchemaNode,
  type ContextSchemaNodeOptions,
  type ContextSchemaObjectNode,
  type ContextSchemaPath,
  type ContextSchemaPathValidationDiagnostic,
  type ContextSchemaPathValidationFailure,
  type ContextSchemaPathValidationResult,
  type ContextSchemaPathValidationSuccess,
  type ContextSchemaValueNode,
};
