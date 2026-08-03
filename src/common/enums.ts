enum Service {
  Database = 'database',
  Drizzle = 'drizzle',
  PostgresPool = 'postgresPool',
  ContextSchemaPathValidator = 'contextSchemaPathValidator',
  RuleExpressionAstValidator = 'ruleExpressionAstValidator',
  RuleExpressionParser = 'ruleExpressionParser',
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
