import {RuleExpressionParserDiagnosticCode} from './enums';
import {RuleExpressionParserService} from './rule-expression-parser.service';

describe('RuleExpressionParserService', () => {
  const parser = new RuleExpressionParserService();

  it('parses a valid rule expression into an AST', () => {
    const result = parser.parse(
      "user.country == 'PL' && cart.total >= 200 ? cart.total * 0.15 : 0",
    );

    expect(result.isSuccess).toBe(true);

    if (result.isSuccess) {
      expect(result.ast.type).toBe('ConditionalExpression');
    }
  });

  it('returns an invalid syntax diagnostic for an invalid expression', () => {
    const result = parser.parse('user.country == && cart.total');

    expect(result).toEqual({
      diagnostic: {
        code: RuleExpressionParserDiagnosticCode.InvalidSyntax,
        message: 'Expression contains invalid syntax.',
      },
      isSuccess: false,
    });
  });

  it('returns a diagnostic when an expression has trailing content', () => {
    const result = parser.parse('cart.total; user.country');

    expect(result).toEqual({
      diagnostic: {
        code: RuleExpressionParserDiagnosticCode.UnexpectedTrailingContent,
        message: 'Expression must contain exactly one expression.',
      },
      isSuccess: false,
    });
  });
});
