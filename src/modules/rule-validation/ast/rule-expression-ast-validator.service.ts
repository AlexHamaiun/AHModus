import {Injectable} from '@nestjs/common';
import type jsep from 'jsep';

import {RuleExpressionAstValidationDiagnosticCode} from './enums';
import type {
  RuleExpressionAst,
  RuleExpressionAstValidationFailure,
  RuleExpressionAstValidationResult,
  RuleExpressionAstValidationState,
} from './types';

interface IRuleExpressionAstValidatorService {
  validate(ast: RuleExpressionAst): RuleExpressionAstValidationResult;
}

@Injectable()
class RuleExpressionAstValidatorService implements IRuleExpressionAstValidatorService {
  private static readonly allowedBinaryOperators = new Set([
    '!=',
    '&&',
    '*',
    '+',
    '-',
    '/',
    '<',
    '<=',
    '==',
    '>',
    '>=',
    '||',
  ]);

  private static readonly allowedUnaryOperators = new Set(['!', '-']);

  private static readonly forbiddenMemberNames = new Set(['__proto__', 'constructor', 'prototype']);

  private static readonly maxAstDepth = 20;

  private static readonly maxAstNodeCount = 100;

  validate(ast: RuleExpressionAst): RuleExpressionAstValidationResult {
    return this.validateNode(ast, 1, {nodeCount: 0});
  }

  private validateNode(
    ast: RuleExpressionAst,
    depth: number,
    state: RuleExpressionAstValidationState,
  ): RuleExpressionAstValidationResult {
    if (depth > RuleExpressionAstValidatorService.maxAstDepth) {
      return this.createFailure(
        RuleExpressionAstValidationDiagnosticCode.MaxAstDepthExceeded,
        `Expression exceeds the maximum AST depth of ${RuleExpressionAstValidatorService.maxAstDepth}.`,
      );
    }

    state.nodeCount += 1;

    if (state.nodeCount > RuleExpressionAstValidatorService.maxAstNodeCount) {
      return this.createFailure(
        RuleExpressionAstValidationDiagnosticCode.MaxAstNodeCountExceeded,
        `Expression exceeds the maximum AST node count of ${RuleExpressionAstValidatorService.maxAstNodeCount}.`,
      );
    }

    switch (ast.type) {
      case 'BinaryExpression':
        return this.validateBinaryExpression(ast as jsep.BinaryExpression, depth, state);
      case 'ConditionalExpression':
        return this.validateConditionalExpression(ast as jsep.ConditionalExpression, depth, state);
      case 'Identifier':
        return {isValid: true};
      case 'Literal':
        return this.validateLiteral(ast as jsep.Literal);
      case 'MemberExpression':
        return this.validateMemberExpression(ast as jsep.MemberExpression, depth, state);
      case 'UnaryExpression':
        return this.validateUnaryExpression(ast as jsep.UnaryExpression, depth, state);
      default:
        return this.createFailure(
          RuleExpressionAstValidationDiagnosticCode.UnsupportedNode,
          `AST node type "${ast.type}" is not allowed.`,
        );
    }
  }

  private validateBinaryExpression(
    ast: jsep.BinaryExpression,
    depth: number,
    state: RuleExpressionAstValidationState,
  ): RuleExpressionAstValidationResult {
    if (!RuleExpressionAstValidatorService.allowedBinaryOperators.has(ast.operator)) {
      return this.createFailure(
        RuleExpressionAstValidationDiagnosticCode.UnsupportedOperator,
        `Binary operator "${ast.operator}" is not allowed.`,
      );
    }

    return this.validateChildren([ast.left, ast.right], depth, state);
  }

  private validateConditionalExpression(
    ast: jsep.ConditionalExpression,
    depth: number,
    state: RuleExpressionAstValidationState,
  ): RuleExpressionAstValidationResult {
    return this.validateChildren([ast.test, ast.consequent, ast.alternate], depth, state);
  }

  private validateLiteral(ast: jsep.Literal): RuleExpressionAstValidationResult {
    if (
      ast.value === null ||
      typeof ast.value === 'boolean' ||
      typeof ast.value === 'number' ||
      typeof ast.value === 'string'
    ) {
      return {isValid: true};
    }

    return this.createFailure(
      RuleExpressionAstValidationDiagnosticCode.UnsupportedNode,
      `Literal value "${String(ast.value)}" is not allowed.`,
    );
  }

  private validateMemberExpression(
    ast: jsep.MemberExpression,
    depth: number,
    state: RuleExpressionAstValidationState,
  ): RuleExpressionAstValidationResult {
    if (ast.computed) {
      return this.createFailure(
        RuleExpressionAstValidationDiagnosticCode.ComputedMemberAccessNotAllowed,
        'Computed member access is not allowed.',
      );
    }

    if (ast.property.type !== 'Identifier') {
      return this.createFailure(
        RuleExpressionAstValidationDiagnosticCode.UnsupportedNode,
        `AST node type "${ast.property.type}" is not allowed as a member property.`,
      );
    }

    const propertyName = (ast.property as jsep.Identifier).name;

    if (RuleExpressionAstValidatorService.forbiddenMemberNames.has(propertyName)) {
      return this.createFailure(
        RuleExpressionAstValidationDiagnosticCode.ForbiddenMemberAccess,
        `Member "${propertyName}" is not allowed.`,
      );
    }

    return this.validateNode(ast.object, depth + 1, state);
  }

  private validateUnaryExpression(
    ast: jsep.UnaryExpression,
    depth: number,
    state: RuleExpressionAstValidationState,
  ): RuleExpressionAstValidationResult {
    if (!RuleExpressionAstValidatorService.allowedUnaryOperators.has(ast.operator)) {
      return this.createFailure(
        RuleExpressionAstValidationDiagnosticCode.UnsupportedOperator,
        `Unary operator "${ast.operator}" is not allowed.`,
      );
    }

    return this.validateNode(ast.argument, depth + 1, state);
  }

  private validateChildren(
    asts: readonly RuleExpressionAst[],
    depth: number,
    state: RuleExpressionAstValidationState,
  ): RuleExpressionAstValidationResult {
    for (const ast of asts) {
      const result = this.validateNode(ast, depth + 1, state);

      if (!result.isValid) {
        return result;
      }
    }

    return {isValid: true};
  }

  private createFailure(
    code: RuleExpressionAstValidationDiagnosticCode,
    message: string,
  ): RuleExpressionAstValidationFailure {
    return {
      diagnostic: {code, message},
      isValid: false,
    };
  }
}

export {type IRuleExpressionAstValidatorService, RuleExpressionAstValidatorService};
