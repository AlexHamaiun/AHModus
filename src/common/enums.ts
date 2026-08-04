enum Service {
  Database = 'database',
  Drizzle = 'drizzle',
  PostgresPool = 'postgresPool',
  ContextSchemaPathResolver = 'contextSchemaPathResolver',
  ContextSchemaPathValidator = 'contextSchemaPathValidator',
  RuleExpressionAstValidator = 'ruleExpressionAstValidator',
  RuleExpressionParser = 'ruleExpressionParser',
  RuleExpressionValidation = 'ruleExpressionValidation',
  RuleExpressionTypeValidator = 'ruleExpressionTypeValidator',
  Rules = 'rules',
}

enum Repository {
  Rules = 'rulesRepository',
}

enum Resource {
  Health = 'health',
  Rules = 'rules',
}

export {Repository, Resource, Service};
