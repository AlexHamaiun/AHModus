import {Injectable} from '@nestjs/common';
import type jsep from 'jsep';

import type {RuleExpressionAst} from '../parser/types';
import {ContextSchemaNodeKind, ContextSchemaPathValidationDiagnosticCode} from './enums';
import type {
  ContextSchema,
  ContextSchemaNode,
  ContextSchemaPath,
  ContextSchemaPathValidationFailure,
  ContextSchemaPathValidationResult,
} from './types';

interface IContextSchemaPathValidatorService {
  validate(ast: RuleExpressionAst, contextSchema: ContextSchema): ContextSchemaPathValidationResult;
}

@Injectable()
class ContextSchemaPathValidatorService implements IContextSchemaPathValidatorService {
  validate(
    ast: RuleExpressionAst,
    contextSchema: ContextSchema,
  ): ContextSchemaPathValidationResult {
    return this.validateNode(ast, contextSchema);
  }

  private validateNode(
    ast: RuleExpressionAst,
    contextSchema: ContextSchema,
  ): ContextSchemaPathValidationResult {
    switch (ast.type) {
      case 'BinaryExpression': {
        const binaryExpression = ast as jsep.BinaryExpression;

        return this.validateNodes([binaryExpression.left, binaryExpression.right], contextSchema);
      }
      case 'ConditionalExpression': {
        const conditionalExpression = ast as jsep.ConditionalExpression;

        return this.validateNodes(
          [
            conditionalExpression.test,
            conditionalExpression.consequent,
            conditionalExpression.alternate,
          ],
          contextSchema,
        );
      }
      case 'Identifier':
        return this.validateContextPath([(ast as jsep.Identifier).name], contextSchema);
      case 'Literal':
        return {isValid: true};
      case 'MemberExpression':
        return this.validateMemberExpression(ast as jsep.MemberExpression, contextSchema);
      case 'UnaryExpression':
        return this.validateNode((ast as jsep.UnaryExpression).argument, contextSchema);
      default:
        return {isValid: true};
    }
  }

  private validateMemberExpression(
    ast: jsep.MemberExpression,
    contextSchema: ContextSchema,
  ): ContextSchemaPathValidationResult {
    const contextPath = this.getContextPath(ast);

    if (contextPath === undefined) {
      return this.createFailure(
        ContextSchemaPathValidationDiagnosticCode.InvalidContextPath,
        'Member access must start with a context root identifier.',
      );
    }

    return this.validateContextPath(contextPath, contextSchema);
  }

  private getContextPath(ast: jsep.MemberExpression): ContextSchemaPath | undefined {
    const segments: string[] = [];
    let currentAst: RuleExpressionAst = ast;

    while (currentAst.type === 'MemberExpression') {
      const memberExpression = currentAst as jsep.MemberExpression;

      if (memberExpression.computed || memberExpression.property.type !== 'Identifier') {
        return undefined;
      }

      segments.unshift((memberExpression.property as jsep.Identifier).name);
      currentAst = memberExpression.object;
    }

    if (currentAst.type !== 'Identifier') {
      return undefined;
    }

    segments.unshift((currentAst as jsep.Identifier).name);

    return segments;
  }

  private validateContextPath(
    contextPath: ContextSchemaPath,
    contextSchema: ContextSchema,
  ): ContextSchemaPathValidationResult {
    let currentNode: ContextSchemaNode = contextSchema;

    for (const segment of contextPath) {
      if (currentNode.kind !== ContextSchemaNodeKind.Object) {
        return this.createUnknownContextPathFailure(contextPath);
      }

      const nextNode: ContextSchemaNode | undefined = currentNode.properties[segment];

      if (nextNode === undefined) {
        return this.createUnknownContextPathFailure(contextPath);
      }

      currentNode = nextNode;
    }

    return {isValid: true};
  }

  private validateNodes(
    asts: readonly RuleExpressionAst[],
    contextSchema: ContextSchema,
  ): ContextSchemaPathValidationResult {
    for (const ast of asts) {
      const result = this.validateNode(ast, contextSchema);

      if (!result.isValid) {
        return result;
      }
    }

    return {isValid: true};
  }

  private createUnknownContextPathFailure(
    contextPath: ContextSchemaPath,
  ): ContextSchemaPathValidationFailure {
    return this.createFailure(
      ContextSchemaPathValidationDiagnosticCode.UnknownContextPath,
      `Context path "${contextPath.join('.')}" is not defined.`,
    );
  }

  private createFailure(
    code: ContextSchemaPathValidationDiagnosticCode,
    message: string,
  ): ContextSchemaPathValidationFailure {
    return {
      diagnostic: {code, message},
      isValid: false,
    };
  }
}

export {type IContextSchemaPathValidatorService, ContextSchemaPathValidatorService};
