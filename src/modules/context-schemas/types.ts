import type {InferInsertModel, InferSelectModel} from 'drizzle-orm';

import type {contextSchemas, contextSchemaVersions} from '../../infrastructure/database/schema';
import type {
  ContextSchemaNodeKind,
  ContextSchemaValidationDiagnosticCode,
  ContextSchemaValueType,
} from './enums';

type ContextSchemaDefinition = {
  readonly kind: ContextSchemaNodeKind.Object;
  readonly properties: Readonly<Record<string, ContextSchemaNode>>;
};

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

type ContextSchemaValidationDiagnostic = {
  readonly code: ContextSchemaValidationDiagnosticCode;
  readonly message: string;
};

type ContextSchemaValidationFailure = {
  readonly diagnostic: ContextSchemaValidationDiagnostic;
  readonly isValid: false;
};

type ContextSchemaValidationCheckResult =
  ContextSchemaValidationFailure | ContextSchemaValidationCheckSuccess;

type ContextSchemaValidationCheckSuccess = {
  readonly isValid: true;
};

type ContextSchemaValidationResult =
  ContextSchemaValidationFailure | ContextSchemaValidationSuccess;

type ContextSchemaValidationState = {
  nodeCount: number;
};

type ContextSchemaValidationSuccess = {
  readonly contextSchema: ContextSchemaDefinition;
  readonly isValid: true;
};

type NewContextSchema = InferInsertModel<typeof contextSchemas>;
type NewContextSchemaVersion = InferInsertModel<typeof contextSchemaVersions>;
type ContextSchemaRecord = InferSelectModel<typeof contextSchemas>;
type ContextSchemaVersion = InferSelectModel<typeof contextSchemaVersions>;

export {
  type ContextSchemaDefinition,
  type ContextSchemaNode,
  type ContextSchemaNodeOptions,
  type ContextSchemaObjectNode,
  type ContextSchemaRecord,
  type ContextSchemaVersion,
  type ContextSchemaValidationCheckResult,
  type ContextSchemaValidationCheckSuccess,
  type ContextSchemaValidationDiagnostic,
  type ContextSchemaValidationFailure,
  type ContextSchemaValidationResult,
  type ContextSchemaValidationState,
  type ContextSchemaValidationSuccess,
  type ContextSchemaValueNode,
  type NewContextSchema,
  type NewContextSchemaVersion,
};
