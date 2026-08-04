import {RuleExpressionAstValidationDiagnosticCode} from './ast/enums';
import {RuleExpressionAstValidatorService} from './ast/rule-expression-ast-validator.service';
import {ContextSchemaPathResolverService} from './context/context-schema-path-resolver.service';
import {ContextSchemaPathValidatorService} from './context/context-schema-path-validator.service';
import {
  ContextSchemaNodeKind,
  ContextSchemaPathValidationDiagnosticCode,
  ContextSchemaValueType,
} from './context/enums';
import type {ContextSchema} from './context/types';
import {RuleExpressionParserDiagnosticCode} from './parser/enums';
import {RuleExpressionParserService} from './parser/rule-expression-parser.service';
import {RuleExpressionTypeValidationDiagnosticCode} from './type/enums';
import {RuleExpressionTypeValidatorService} from './type/rule-expression-type-validator.service';
import {RuleExpressionValidationService} from './rule-expression-validation.service';

describe('RuleExpressionValidationService', () => {
  const validationService = new RuleExpressionValidationService(
    new RuleExpressionParserService(),
    new RuleExpressionAstValidatorService(),
    new ContextSchemaPathValidatorService(new ContextSchemaPathResolverService()),
    new RuleExpressionTypeValidatorService(new ContextSchemaPathResolverService()),
  );
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
  } satisfies ContextSchema;

  it('accepts an expression that passes every validation layer', () => {
    const result = validationService.validate(
      "user.country == 'PL' && cart.total >= 200 ? cart.total * 0.15 : 0",
      contextSchema,
    );

    expect(result).toEqual({isValid: true});
  });

  it('returns the parser diagnostic before later validation layers', () => {
    const result = validationService.validate('user.country == && cart.total', contextSchema);

    expect(result).toEqual({
      diagnostic: {
        code: RuleExpressionParserDiagnosticCode.InvalidSyntax,
        message: 'Expression contains invalid syntax.',
      },
      isValid: false,
    });
  });

  it('returns the AST validator diagnostic before context path validation', () => {
    const result = validationService.validate('dangerousCall()', contextSchema);

    expect(result).toEqual({
      diagnostic: {
        code: RuleExpressionAstValidationDiagnosticCode.UnsupportedNode,
        message: 'AST node type "CallExpression" is not allowed.',
      },
      isValid: false,
    });
  });

  it('returns the context path diagnostic after successful parser and AST validation', () => {
    const result = validationService.validate('user.password == null', contextSchema);

    expect(result).toEqual({
      diagnostic: {
        code: ContextSchemaPathValidationDiagnosticCode.UnknownContextPath,
        message: 'Context path "user.password" is not defined.',
      },
      isValid: false,
    });
  });

  it('returns the type validator diagnostic after successful earlier validation layers', () => {
    const result = validationService.validate('user.country * 5', contextSchema);

    expect(result).toEqual({
      diagnostic: {
        code: RuleExpressionTypeValidationDiagnosticCode.InvalidOperandType,
        message: 'Operator "*" requires number operands, received string and number.',
      },
      isValid: false,
    });
  });
});
