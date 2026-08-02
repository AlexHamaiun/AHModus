enum RuleExpressionAstValidationDiagnosticCode {
  ComputedMemberAccessNotAllowed = 'computed_member_access_not_allowed',
  ForbiddenMemberAccess = 'forbidden_member_access',
  MaxAstDepthExceeded = 'max_ast_depth_exceeded',
  MaxAstNodeCountExceeded = 'max_ast_node_count_exceeded',
  UnsupportedNode = 'unsupported_node',
  UnsupportedOperator = 'unsupported_operator',
}

export {RuleExpressionAstValidationDiagnosticCode};
