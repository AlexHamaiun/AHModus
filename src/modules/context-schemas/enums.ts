enum ContextSchemaEntityName {
  ContextSchema = 'context schema',
  ContextSchemaVersion = 'context schema version',
}

enum ContextSchemaNodeKind {
  Object = 'object',
  Value = 'value',
}

enum ContextSchemaValidationDiagnosticCode {
  InvalidNode = 'invalid_node',
  InvalidRootNode = 'invalid_root_node',
  InvalidPropertyName = 'invalid_property_name',
  MaxDepthExceeded = 'max_depth_exceeded',
  MaxNodeCountExceeded = 'max_node_count_exceeded',
  UnexpectedNodeProperty = 'unexpected_node_property',
}

enum ContextSchemaValidationLimit {
  MaxDepth = 20,
  MaxNodeCount = 100,
}

enum ContextSchemaValueType {
  Boolean = 'boolean',
  Number = 'number',
  String = 'string',
}

export {
  ContextSchemaEntityName,
  ContextSchemaNodeKind,
  ContextSchemaValidationDiagnosticCode,
  ContextSchemaValidationLimit,
  ContextSchemaValueType,
};
