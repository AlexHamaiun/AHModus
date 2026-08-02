import {RuleExpressionAstValidationDiagnosticCode} from './enums';
import {RuleExpressionAstValidatorService} from './rule-expression-ast-validator.service';
import {RuleExpressionParserService} from '../parser/rule-expression-parser.service';
import type {RuleExpressionAst} from '../parser/types';

describe('RuleExpressionAstValidatorService', () => {
  const parser = new RuleExpressionParserService();
  const validator = new RuleExpressionAstValidatorService();

  const createWideAst = (depth: number): RuleExpressionAst => {
    if (depth === 0) {
      return {
        raw: '1',
        type: 'Literal',
        value: 1,
      };
    }

    return {
      alternate: createWideAst(depth - 1),
      consequent: createWideAst(depth - 1),
      test: createWideAst(depth - 1),
      type: 'ConditionalExpression',
    };
  };

  const parseAst = (expression: string) => {
    const result = parser.parse(expression);

    if (!result.isSuccess) {
      throw new Error(`Expected a parsable expression, received: ${result.diagnostic.message}`);
    }

    return result.ast;
  };

  it('accepts the DSL v1 expression subset', () => {
    const result = validator.validate(
      parseAst("user.country == 'PL' && cart.total >= 200 ? cart.total * 0.15 : 0"),
    );

    expect(result).toEqual({isValid: true});
  });

  it('accepts null as a DSL literal', () => {
    const result = validator.validate(parseAst('user.companyId == null ? 0 : 10'));

    expect(result).toEqual({isValid: true});
  });

  it('rejects function calls', () => {
    const result = validator.validate(parseAst('dangerousCall()'));

    expect(result).toEqual({
      diagnostic: {
        code: RuleExpressionAstValidationDiagnosticCode.UnsupportedNode,
        message: 'AST node type "CallExpression" is not allowed.',
      },
      isValid: false,
    });
  });

  it('rejects computed member access', () => {
    const result = validator.validate(parseAst("cart['total']"));

    expect(result).toEqual({
      diagnostic: {
        code: RuleExpressionAstValidationDiagnosticCode.ComputedMemberAccessNotAllowed,
        message: 'Computed member access is not allowed.',
      },
      isValid: false,
    });
  });

  it('rejects forbidden member names', () => {
    const result = validator.validate(parseAst('user.constructor'));

    expect(result).toEqual({
      diagnostic: {
        code: RuleExpressionAstValidationDiagnosticCode.ForbiddenMemberAccess,
        message: 'Member "constructor" is not allowed.',
      },
      isValid: false,
    });
  });

  it('rejects unsupported operators', () => {
    const result = validator.validate(parseAst('cart.total ** 2'));

    expect(result).toEqual({
      diagnostic: {
        code: RuleExpressionAstValidationDiagnosticCode.UnsupportedOperator,
        message: 'Binary operator "**" is not allowed.',
      },
      isValid: false,
    });
  });

  it('rejects expressions exceeding the maximum AST depth', () => {
    const result = validator.validate(parseAst(`${'!'.repeat(20)}cart.total`));

    expect(result).toEqual({
      diagnostic: {
        code: RuleExpressionAstValidationDiagnosticCode.MaxAstDepthExceeded,
        message: 'Expression exceeds the maximum AST depth of 20.',
      },
      isValid: false,
    });
  });

  it('rejects expressions exceeding the maximum AST node count', () => {
    const result = validator.validate(createWideAst(4));

    expect(result).toEqual({
      diagnostic: {
        code: RuleExpressionAstValidationDiagnosticCode.MaxAstNodeCountExceeded,
        message: 'Expression exceeds the maximum AST node count of 100.',
      },
      isValid: false,
    });
  });
});
