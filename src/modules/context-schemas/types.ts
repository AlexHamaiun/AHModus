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

type CreateContextSchemaInput = {
  readonly createdBy?: string;
  readonly description?: string;
  readonly definition: ContextSchemaDefinition;
  readonly key: string;
  readonly name: string;
};

type CreateContextSchemaVersionInput = {
  readonly createdBy?: string;
  readonly definition: ContextSchemaDefinition;
};

type NewContextSchema = InferInsertModel<typeof contextSchemas>;
type NewContextSchemaVersion = InferInsertModel<typeof contextSchemaVersions>;
type ContextSchema = InferSelectModel<typeof contextSchemas>;
type ContextSchemaVersion = InferSelectModel<typeof contextSchemaVersions>;

type ContextSchemaDraft = {
  readonly contextSchema: ContextSchema;
  readonly version: ContextSchemaVersion;
};

type UpdateContextSchemaInput = {
  readonly description?: string | null;
  readonly name?: string;
};

export {
  type CreateContextSchemaInput,
  type CreateContextSchemaVersionInput,
  type ContextSchemaDefinition,
  type ContextSchemaDraft,
  type ContextSchemaNode,
  type ContextSchemaNodeOptions,
  type ContextSchemaObjectNode,
  type ContextSchema,
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
  type UpdateContextSchemaInput,
};
