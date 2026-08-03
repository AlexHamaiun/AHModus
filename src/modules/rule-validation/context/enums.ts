enum ContextSchemaNodeKind {
  Object = 'object',
  Value = 'value',
}

enum ContextSchemaValueType {
  Boolean = 'boolean',
  Number = 'number',
  String = 'string',
}

enum ContextSchemaPathValidationDiagnosticCode {
  InvalidContextPath = 'invalid_context_path',
  UnknownContextPath = 'unknown_context_path',
}

export {ContextSchemaNodeKind, ContextSchemaPathValidationDiagnosticCode, ContextSchemaValueType};
