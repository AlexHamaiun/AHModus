import {ContextSchemaPathResolverService} from '../context/context-schema-path-resolver.service';
import {ContextSchemaNodeKind, ContextSchemaValueType} from '../context/enums';
import type {ContextSchema} from '../context/types';
import {RuleExpressionParserService} from '../parser/rule-expression-parser.service';
import {RuleExpressionTypeValidationDiagnosticCode} from './enums';
import {RuleExpressionTypeValidatorService} from './rule-expression-type-validator.service';

describe('RuleExpressionTypeValidatorService', () => {
  const parser = new RuleExpressionParserService();
  const validator = new RuleExpressionTypeValidatorService(new ContextSchemaPathResolverService());
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
          companyId: {
            kind: ContextSchemaNodeKind.Value,
            nullable: true,
            valueType: ContextSchemaValueType.String,
          },
          country: {
            kind: ContextSchemaNodeKind.Value,
            valueType: ContextSchemaValueType.String,
          },
          isBlocked: {
            kind: ContextSchemaNodeKind.Value,
            valueType: ContextSchemaValueType.Boolean,
          },
        },
      },
    },
  } satisfies ContextSchema;

  const parseAst = (expression: string) => {
    const result = parser.parse(expression);

    if (!result.isSuccess) {
      throw new Error(`Expected a parsable expression, received: ${result.diagnostic.message}`);
    }

    return result.ast;
  };

  it('accepts expressions with compatible operand types', () => {
    const result = validator.validate(
      parseAst('!user.isBlocked && cart.total >= 200 ? cart.total * 0.15 : 0'),
      contextSchema,
    );

    expect(result).toEqual({isValid: true});
  });

  it('accepts a null comparison for a nullable context value', () => {
    const result = validator.validate(parseAst('user.companyId == null'), contextSchema);

    expect(result).toEqual({isValid: true});
  });

  it('rejects arithmetic with a string operand', () => {
    const result = validator.validate(parseAst('user.country * 5'), contextSchema);

    expect(result).toEqual({
      diagnostic: {
        code: RuleExpressionTypeValidationDiagnosticCode.InvalidOperandType,
        message: 'Operator "*" requires number operands, received string and number.',
      },
      isValid: false,
    });
  });

  it('rejects logical operators with a number operand', () => {
    const result = validator.validate(parseAst('cart.total && true'), contextSchema);

    expect(result).toEqual({
      diagnostic: {
        code: RuleExpressionTypeValidationDiagnosticCode.InvalidOperandType,
        message: 'Operator "&&" requires boolean operands, received number and boolean.',
      },
      isValid: false,
    });
  });

  it('rejects conditional branches with incompatible non-null types', () => {
    const result = validator.validate(parseAst("user.country == 'PL' ? 0 : 'free'"), contextSchema);

    expect(result).toEqual({
      diagnostic: {
        code: RuleExpressionTypeValidationDiagnosticCode.IncompatibleConditionalBranchTypes,
        message: 'Conditional branches must have compatible types, received number and string.',
      },
      isValid: false,
    });
  });
});
