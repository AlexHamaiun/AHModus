import {Injectable} from '@nestjs/common';
import jsep from 'jsep';

import {RuleExpressionParserDiagnosticCode} from './enums';
import type {RuleExpressionParseResult} from './types';

interface IRuleExpressionParserService {
  parse(expression: string): RuleExpressionParseResult;
}

@Injectable()
class RuleExpressionParserService implements IRuleExpressionParserService {
  parse(expression: string): RuleExpressionParseResult {
    try {
      const ast = jsep(expression);

      if (ast.type === 'Compound') {
        return {
          diagnostic: {
            code: RuleExpressionParserDiagnosticCode.UnexpectedTrailingContent,
            message: 'Expression must contain exactly one expression.',
          },
          isSuccess: false,
        };
      }

      return {
        ast,
        isSuccess: true,
      };
    } catch {
      return {
        diagnostic: {
          code: RuleExpressionParserDiagnosticCode.InvalidSyntax,
          message: 'Expression contains invalid syntax.',
        },
        isSuccess: false,
      };
    }
  }
}

export {type IRuleExpressionParserService, RuleExpressionParserService};
