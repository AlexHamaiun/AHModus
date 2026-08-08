enum Service {
  Database = 'database',
  Drizzle = 'drizzle',
  PostgresPool = 'postgresPool',
  ContextSchemaPathResolver = 'contextSchemaPathResolver',
  ContextSchemaPathValidator = 'contextSchemaPathValidator',
  ContextSchemaDefinitionValidator = 'contextSchemaDefinitionValidator',
  RuleExpressionAstValidator = 'ruleExpressionAstValidator',
  RuleExpressionParser = 'ruleExpressionParser',
  RuleExpressionValidation = 'ruleExpressionValidation',
  RuleExpressionTypeValidator = 'ruleExpressionTypeValidator',
  ContextSchemas = 'contextSchemas',
  Rules = 'rules',
}

enum Repository {
  ContextSchemas = 'contextSchemasRepository',
  Rules = 'rulesRepository',
  RuleVersions = 'ruleVersionsRepository',
}

enum Resource {
  ContextSchemas = 'context-schemas',
  Health = 'health',
  Rules = 'rules',
}

export {Repository, Resource, Service};
