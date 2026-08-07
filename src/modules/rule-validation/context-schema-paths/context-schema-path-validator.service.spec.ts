import {RuleExpressionParserService} from '../parser/rule-expression-parser.service';
import {ContextSchemaPathResolverService} from './context-schema-path-resolver.service';
import {ContextSchemaNodeKind, ContextSchemaValueType} from '../../context-schemas/enums';
import type {ContextSchemaDefinition} from '../../context-schemas/types';
import {ContextSchemaPathValidationDiagnosticCode} from './enums';
import {ContextSchemaPathValidatorService} from './context-schema-path-validator.service';

describe('ContextSchemaPathValidatorService', () => {
  const parser = new RuleExpressionParserService();
  const validator = new ContextSchemaPathValidatorService(new ContextSchemaPathResolverService());
  const contextSchema = {
    kind: ContextSchemaNodeKind.Object,
    properties: {
      cart: {
        kind: ContextSchemaNodeKind.Object,
        properties: {
          total: {
            kind: ContextSchemaNodeKind.Value,
            valueType: ContextSchemaValueType.Number,
          },
        },
      },
      user: {
        kind: ContextSchemaNodeKind.Object,
        properties: {
          country: {
            kind: ContextSchemaNodeKind.Value,
            valueType: ContextSchemaValueType.String,
          },
        },
      },
    },
  } satisfies ContextSchemaDefinition;

  const parseAst = (expression: string) => {
    const result = parser.parse(expression);

    if (!result.isSuccess) {
      throw new Error(`Expected a parsable expression, received: ${result.diagnostic.message}`);
    }

    return result.ast;
  };

  it('accepts member paths defined by the context schema', () => {
    const result = validator.validate(
      parseAst("user.country == 'PL' && cart.total >= 200"),
      contextSchema,
    );

    expect(result).toEqual({isValid: true});
  });

  it('rejects an unknown context property', () => {
    const result = validator.validate(parseAst('user.password == null'), contextSchema);

    expect(result).toEqual({
      diagnostic: {
        code: ContextSchemaPathValidationDiagnosticCode.UnknownContextPath,
        message: 'Context path "user.password" is not defined.',
      },
      isValid: false,
    });
  });

  it('rejects an unknown context root', () => {
    const result = validator.validate(parseAst('order.total > 100'), contextSchema);

    expect(result).toEqual({
      diagnostic: {
        code: ContextSchemaPathValidationDiagnosticCode.UnknownContextPath,
        message: 'Context path "order.total" is not defined.',
      },
      isValid: false,
    });
  });

  it('rejects a bare identifier outside the context schema', () => {
    const result = validator.validate(parseAst('process'), contextSchema);

    expect(result).toEqual({
      diagnostic: {
        code: ContextSchemaPathValidationDiagnosticCode.UnknownContextPath,
        message: 'Context path "process" is not defined.',
      },
      isValid: false,
    });
  });

  it('rejects member access that does not start from a context root', () => {
    const result = validator.validate(
      parseAst('(user.country ? cart : user).total'),
      contextSchema,
    );

    expect(result).toEqual({
      diagnostic: {
        code: ContextSchemaPathValidationDiagnosticCode.InvalidContextPath,
        message: 'Member access must start with a context root identifier.',
      },
      isValid: false,
    });
  });
});
