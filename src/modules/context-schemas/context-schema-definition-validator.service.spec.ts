import {
  ContextSchemaNodeKind,
  ContextSchemaValidationDiagnosticCode,
  ContextSchemaValidationLimit,
  ContextSchemaValueType,
} from './enums';
import {ContextSchemaDefinitionValidatorService} from './context-schema-definition-validator.service';

describe('ContextSchemaDefinitionValidatorService', () => {
  const validator = new ContextSchemaDefinitionValidatorService();

  it('accepts a valid context schema', () => {
    const result = validator.validate({
      kind: ContextSchemaNodeKind.Object,
      properties: {
        cart: {
          kind: ContextSchemaNodeKind.Object,
          properties: {
            total: {
              kind: ContextSchemaNodeKind.Value,
              nullable: true,
              valueType: ContextSchemaValueType.Number,
            },
          },
        },
      },
    });

    expect(result.isValid).toBe(true);
  });

  it('rejects a non-object root', () => {
    const result = validator.validate({
      kind: ContextSchemaNodeKind.Value,
      valueType: ContextSchemaValueType.String,
    });

    expect(result).toEqual({
      diagnostic: {
        code: ContextSchemaValidationDiagnosticCode.InvalidRootNode,
        message: 'The context schema root must be an object node.',
      },
      isValid: false,
    });
  });

  it('rejects an object node without object properties', () => {
    const result = validator.validate({
      kind: ContextSchemaNodeKind.Object,
      properties: [],
    });

    expect(result).toEqual({
      diagnostic: {
        code: ContextSchemaValidationDiagnosticCode.InvalidNode,
        message: 'Object context schema node at "$" must define an object "properties" field.',
      },
      isValid: false,
    });
  });

  it('rejects an unsupported scalar value type', () => {
    const result = validator.validate({
      kind: ContextSchemaNodeKind.Object,
      properties: {
        cart: {
          kind: ContextSchemaNodeKind.Value,
          valueType: 'currency',
        },
      },
    });

    expect(result).toEqual({
      diagnostic: {
        code: ContextSchemaValidationDiagnosticCode.InvalidNode,
        message: 'Value context schema node at "cart" must define a supported "valueType".',
      },
      isValid: false,
    });
  });

  it('rejects a non-boolean node option', () => {
    const result = validator.validate({
      kind: ContextSchemaNodeKind.Object,
      properties: {
        cart: {
          kind: ContextSchemaNodeKind.Value,
          nullable: 'yes',
          valueType: ContextSchemaValueType.Number,
        },
      },
    });

    expect(result).toEqual({
      diagnostic: {
        code: ContextSchemaValidationDiagnosticCode.InvalidNode,
        message: 'Context schema option "nullable" at "cart" must be a boolean.',
      },
      isValid: false,
    });
  });

  it('rejects properties that cannot be addressed in the DSL', () => {
    const result = validator.validate({
      kind: ContextSchemaNodeKind.Object,
      properties: {
        'cart-total': {
          kind: ContextSchemaNodeKind.Value,
          valueType: ContextSchemaValueType.Number,
        },
      },
    });

    expect(result).toEqual({
      diagnostic: {
        code: ContextSchemaValidationDiagnosticCode.InvalidPropertyName,
        message: 'Context property "cart-total" must be a valid DSL identifier.',
      },
      isValid: false,
    });
  });

  it('rejects unexpected node properties', () => {
    const result = validator.validate({
      kind: ContextSchemaNodeKind.Object,
      properties: {},
      valueType: ContextSchemaValueType.String,
    });

    expect(result).toEqual({
      diagnostic: {
        code: ContextSchemaValidationDiagnosticCode.UnexpectedNodeProperty,
        message: 'Context schema node at "$" does not support property "valueType".',
      },
      isValid: false,
    });
  });

  it('rejects schemas that exceed the nesting limit', () => {
    let schema: unknown = {
      kind: ContextSchemaNodeKind.Value,
      valueType: ContextSchemaValueType.String,
    };

    for (let depth = 0; depth <= Number(ContextSchemaValidationLimit.MaxDepth); depth += 1) {
      schema = {
        kind: ContextSchemaNodeKind.Object,
        properties: {
          value: schema,
        },
      };
    }

    const result = validator.validate(schema);

    expect(result).toEqual({
      diagnostic: {
        code: ContextSchemaValidationDiagnosticCode.MaxDepthExceeded,
        message: `Context schema exceeds the maximum depth of ${ContextSchemaValidationLimit.MaxDepth}.`,
      },
      isValid: false,
    });
  });
});
