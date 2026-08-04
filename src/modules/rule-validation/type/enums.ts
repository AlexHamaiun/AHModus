enum RuleExpressionTypeValidationDiagnosticCode {
  ContextPathIsNotValue = 'context_path_is_not_value',
  IncompatibleConditionalBranchTypes = 'incompatible_conditional_branch_types',
  InvalidOperandType = 'invalid_operand_type',
  UnsupportedNode = 'unsupported_node',
}

enum RuleExpressionValueType {
  Boolean = 'boolean',
  Null = 'null',
  Number = 'number',
  String = 'string',
}

export {RuleExpressionTypeValidationDiagnosticCode, RuleExpressionValueType};
