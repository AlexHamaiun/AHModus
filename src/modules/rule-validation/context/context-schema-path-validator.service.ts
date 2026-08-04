import {Inject, Injectable} from '@nestjs/common';
import type jsep from 'jsep';

import {Service} from '../../../common/enums';
import type {RuleExpressionAst} from '../parser/types';
import type {IContextSchemaPathResolverService} from './context-schema-path-resolver.service';
import type {ContextSchema, ContextSchemaPathValidationResult} from './types';

interface IContextSchemaPathValidatorService {
  validate(ast: RuleExpressionAst, contextSchema: ContextSchema): ContextSchemaPathValidationResult;
}

@Injectable()
class ContextSchemaPathValidatorService implements IContextSchemaPathValidatorService {
  constructor(
    @Inject(Service.ContextSchemaPathResolver)
    private readonly contextSchemaPathResolverService: IContextSchemaPathResolverService,
  ) {}

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
      case 'MemberExpression':
        return this.validateContextPath(ast, contextSchema);
      case 'Literal':
        return {isValid: true};
      case 'UnaryExpression':
        return this.validateNode((ast as jsep.UnaryExpression).argument, contextSchema);
      default:
        return {isValid: true};
    }
  }

  private validateContextPath(
    ast: RuleExpressionAst,
    contextSchema: ContextSchema,
  ): ContextSchemaPathValidationResult {
    const resolutionResult = this.contextSchemaPathResolverService.resolve(ast, contextSchema);

    if (!resolutionResult.isSuccess) {
      return {
        diagnostic: resolutionResult.diagnostic,
        isValid: false,
      };
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
}

export {type IContextSchemaPathValidatorService, ContextSchemaPathValidatorService};
