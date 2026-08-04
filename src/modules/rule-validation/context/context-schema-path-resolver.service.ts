import {Injectable} from '@nestjs/common';
import type jsep from 'jsep';

import type {RuleExpressionAst} from '../parser/types';
import {ContextSchemaNodeKind, ContextSchemaPathValidationDiagnosticCode} from './enums';
import type {
  ContextSchema,
  ContextSchemaNode,
  ContextSchemaPath,
  ContextSchemaPathResolutionFailure,
  ContextSchemaPathResolutionResult,
} from './types';

interface IContextSchemaPathResolverService {
  resolve(ast: RuleExpressionAst, contextSchema: ContextSchema): ContextSchemaPathResolutionResult;
}

@Injectable()
class ContextSchemaPathResolverService implements IContextSchemaPathResolverService {
  resolve(ast: RuleExpressionAst, contextSchema: ContextSchema): ContextSchemaPathResolutionResult {
    const contextPath = this.getContextPath(ast);

    if (contextPath === undefined) {
      return this.createFailure(
        ContextSchemaPathValidationDiagnosticCode.InvalidContextPath,
        'Member access must start with a context root identifier.',
      );
    }

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

    return {
      contextPath,
      isSuccess: true,
      node: currentNode,
    };
  }

  private getContextPath(ast: RuleExpressionAst): ContextSchemaPath | undefined {
    if (ast.type === 'Identifier') {
      return [(ast as jsep.Identifier).name];
    }

    if (ast.type !== 'MemberExpression') {
      return undefined;
    }

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

  private createUnknownContextPathFailure(
    contextPath: ContextSchemaPath,
  ): ContextSchemaPathResolutionFailure {
    return this.createFailure(
      ContextSchemaPathValidationDiagnosticCode.UnknownContextPath,
      `Context path "${contextPath.join('.')}" is not defined.`,
    );
  }

  private createFailure(
    code: ContextSchemaPathValidationDiagnosticCode,
    message: string,
  ): ContextSchemaPathResolutionFailure {
    return {
      diagnostic: {code, message},
      isSuccess: false,
    };
  }
}

export {type IContextSchemaPathResolverService, ContextSchemaPathResolverService};
