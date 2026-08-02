import type jsep from 'jsep';

import {RuleExpressionParserDiagnosticCode} from './enums';

type RuleExpressionAst = jsep.Expression;

type RuleExpressionParseDiagnostic = {
  readonly code: RuleExpressionParserDiagnosticCode;
  readonly message: string;
};

type RuleExpressionParseFailure = {
  readonly diagnostic: RuleExpressionParseDiagnostic;
  readonly isSuccess: false;
};

type RuleExpressionParseResult = RuleExpressionParseFailure | RuleExpressionParseSuccess;

type RuleExpressionParseSuccess = {
  readonly ast: RuleExpressionAst;
  readonly isSuccess: true;
};

export {
  type RuleExpressionAst,
  type RuleExpressionParseDiagnostic,
  type RuleExpressionParseFailure,
  type RuleExpressionParseResult,
  type RuleExpressionParseSuccess,
};
