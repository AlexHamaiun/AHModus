import {Inject, Injectable} from '@nestjs/common';
import type jsep from 'jsep';

import {Service} from '../../../common/enums';
import {ContextSchemaNodeKind, ContextSchemaValueType} from '../../context-schemas/enums';
import type {ContextSchemaDefinition, ContextSchemaValueNode} from '../../context-schemas/types';
import type {RuleExpressionAst} from '../parser/types';
import type {IContextSchemaPathResolverService} from '../context-schema-paths/context-schema-path-resolver.service';
import {RuleExpressionTypeValidationDiagnosticCode, RuleExpressionValueType} from './enums';
import type {
  RuleExpressionInferredType,
  RuleExpressionTypeInferenceFailure,
  RuleExpressionTypeInferenceResult,
  RuleExpressionTypeValidationResult,
} from './types';

interface IRuleExpressionTypeValidatorService {
  validate(
    ast: RuleExpressionAst,
    contextSchema: ContextSchemaDefinition,
  ): RuleExpressionTypeValidationResult;
}

@Injectable()
class RuleExpressionTypeValidatorService implements IRuleExpressionTypeValidatorService {
  private static readonly booleanType: RuleExpressionInferredType = {
    valueTypes: [RuleExpressionValueType.Boolean],
  };

  private static readonly nullType: RuleExpressionInferredType = {
    valueTypes: [RuleExpressionValueType.Null],
  };

  private static readonly numberType: RuleExpressionInferredType = {
    valueTypes: [RuleExpressionValueType.Number],
  };

  private static readonly stringType: RuleExpressionInferredType = {
    valueTypes: [RuleExpressionValueType.String],
  };

  constructor(
    @Inject(Service.ContextSchemaPathResolver)
    private readonly contextSchemaPathResolverService: IContextSchemaPathResolverService,
  ) {}

  validate(
    ast: RuleExpressionAst,
    contextSchema: ContextSchemaDefinition,
  ): RuleExpressionTypeValidationResult {
    const inferenceResult = this.inferType(ast, contextSchema);

    if (!inferenceResult.isSuccess) {
      return {
        diagnostic: inferenceResult.diagnostic,
        isValid: false,
      };
    }

    return {isValid: true};
  }

  private inferType(
    ast: RuleExpressionAst,
    contextSchema: ContextSchemaDefinition,
  ): RuleExpressionTypeInferenceResult {
    switch (ast.type) {
      case 'BinaryExpression':
        return this.inferBinaryExpressionType(ast as jsep.BinaryExpression, contextSchema);
      case 'ConditionalExpression':
        return this.inferConditionalExpressionType(
          ast as jsep.ConditionalExpression,
          contextSchema,
        );
      case 'Identifier':
      case 'MemberExpression':
        return this.inferContextPathType(ast, contextSchema);
      case 'Literal':
        return this.inferLiteralType(ast as jsep.Literal);
      case 'UnaryExpression':
        return this.inferUnaryExpressionType(ast as jsep.UnaryExpression, contextSchema);
      default:
        return this.createInferenceFailure(
          RuleExpressionTypeValidationDiagnosticCode.UnsupportedNode,
          `AST node type "${ast.type}" is not supported for type validation.`,
        );
    }
  }

  private inferBinaryExpressionType(
    ast: jsep.BinaryExpression,
    contextSchema: ContextSchemaDefinition,
  ): RuleExpressionTypeInferenceResult {
    const leftResult = this.inferType(ast.left, contextSchema);

    if (!leftResult.isSuccess) {
      return leftResult;
    }

    const rightResult = this.inferType(ast.right, contextSchema);

    if (!rightResult.isSuccess) {
      return rightResult;
    }

    switch (ast.operator) {
      case '+':
      case '-':
      case '*':
      case '/':
        return this.inferNumericBinaryExpressionType(
          ast.operator,
          leftResult.inferredType,
          rightResult.inferredType,
        );
      case '<':
      case '<=':
      case '>':
      case '>=':
        return this.inferNumericComparisonType(
          ast.operator,
          leftResult.inferredType,
          rightResult.inferredType,
        );
      case '==':
      case '!=':
        return this.inferEqualityComparisonType(
          ast.operator,
          leftResult.inferredType,
          rightResult.inferredType,
        );
      case '&&':
      case '||':
        return this.inferLogicalBinaryExpressionType(
          ast.operator,
          leftResult.inferredType,
          rightResult.inferredType,
        );
      default:
        return this.createInferenceFailure(
          RuleExpressionTypeValidationDiagnosticCode.UnsupportedNode,
          `Binary operator "${ast.operator}" is not supported for type validation.`,
        );
    }
  }

  private inferConditionalExpressionType(
    ast: jsep.ConditionalExpression,
    contextSchema: ContextSchemaDefinition,
  ): RuleExpressionTypeInferenceResult {
    const testResult = this.inferType(ast.test, contextSchema);

    if (!testResult.isSuccess) {
      return testResult;
    }

    if (!this.hasExactlyType(testResult.inferredType, RuleExpressionValueType.Boolean)) {
      return this.createInferenceFailure(
        RuleExpressionTypeValidationDiagnosticCode.InvalidOperandType,
        `Conditional test must be boolean, received ${this.formatType(testResult.inferredType)}.`,
      );
    }

    const consequentResult = this.inferType(ast.consequent, contextSchema);

    if (!consequentResult.isSuccess) {
      return consequentResult;
    }

    const alternateResult = this.inferType(ast.alternate, contextSchema);

    if (!alternateResult.isSuccess) {
      return alternateResult;
    }

    const inferredType = this.mergeConditionalBranchTypes(
      consequentResult.inferredType,
      alternateResult.inferredType,
    );

    if (inferredType === undefined) {
      return this.createInferenceFailure(
        RuleExpressionTypeValidationDiagnosticCode.IncompatibleConditionalBranchTypes,
        `Conditional branches must have compatible types, received ${this.formatType(consequentResult.inferredType)} and ${this.formatType(alternateResult.inferredType)}.`,
      );
    }

    return {
      inferredType,
      isSuccess: true,
    };
  }

  private inferContextPathType(
    ast: RuleExpressionAst,
    contextSchema: ContextSchemaDefinition,
  ): RuleExpressionTypeInferenceResult {
    const resolutionResult = this.contextSchemaPathResolverService.resolve(ast, contextSchema);

    if (!resolutionResult.isSuccess) {
      return this.createInferenceFailureFromDiagnostic(resolutionResult.diagnostic);
    }

    if (resolutionResult.node.kind !== ContextSchemaNodeKind.Value) {
      return this.createInferenceFailure(
        RuleExpressionTypeValidationDiagnosticCode.ContextPathIsNotValue,
        `Context path "${resolutionResult.contextPath.join('.')}" must reference a value.`,
      );
    }

    return {
      inferredType: this.getContextValueType(resolutionResult.node),
      isSuccess: true,
    };
  }

  private inferLiteralType(ast: jsep.Literal): RuleExpressionTypeInferenceResult {
    if (ast.value === null) {
      return {
        inferredType: RuleExpressionTypeValidatorService.nullType,
        isSuccess: true,
      };
    }

    if (typeof ast.value === 'boolean') {
      return {
        inferredType: RuleExpressionTypeValidatorService.booleanType,
        isSuccess: true,
      };
    }

    if (typeof ast.value === 'number') {
      return {
        inferredType: RuleExpressionTypeValidatorService.numberType,
        isSuccess: true,
      };
    }

    if (typeof ast.value === 'string') {
      return {
        inferredType: RuleExpressionTypeValidatorService.stringType,
        isSuccess: true,
      };
    }

    return this.createInferenceFailure(
      RuleExpressionTypeValidationDiagnosticCode.UnsupportedNode,
      `Literal value "${String(ast.value)}" is not supported for type validation.`,
    );
  }

  private inferLogicalBinaryExpressionType(
    operator: string,
    leftType: RuleExpressionInferredType,
    rightType: RuleExpressionInferredType,
  ): RuleExpressionTypeInferenceResult {
    if (
      !this.hasExactlyType(leftType, RuleExpressionValueType.Boolean) ||
      !this.hasExactlyType(rightType, RuleExpressionValueType.Boolean)
    ) {
      return this.createInvalidOperandTypeFailure(
        operator,
        RuleExpressionValueType.Boolean,
        leftType,
        rightType,
      );
    }

    return {
      inferredType: RuleExpressionTypeValidatorService.booleanType,
      isSuccess: true,
    };
  }

  private inferNumericBinaryExpressionType(
    operator: string,
    leftType: RuleExpressionInferredType,
    rightType: RuleExpressionInferredType,
  ): RuleExpressionTypeInferenceResult {
    if (
      !this.hasExactlyType(leftType, RuleExpressionValueType.Number) ||
      !this.hasExactlyType(rightType, RuleExpressionValueType.Number)
    ) {
      return this.createInvalidOperandTypeFailure(
        operator,
        RuleExpressionValueType.Number,
        leftType,
        rightType,
      );
    }

    return {
      inferredType: RuleExpressionTypeValidatorService.numberType,
      isSuccess: true,
    };
  }

  private inferNumericComparisonType(
    operator: string,
    leftType: RuleExpressionInferredType,
    rightType: RuleExpressionInferredType,
  ): RuleExpressionTypeInferenceResult {
    const result = this.inferNumericBinaryExpressionType(operator, leftType, rightType);

    if (!result.isSuccess) {
      return result;
    }

    return {
      inferredType: RuleExpressionTypeValidatorService.booleanType,
      isSuccess: true,
    };
  }

  private inferEqualityComparisonType(
    operator: string,
    leftType: RuleExpressionInferredType,
    rightType: RuleExpressionInferredType,
  ): RuleExpressionTypeInferenceResult {
    if (!this.hasSharedType(leftType, rightType)) {
      return this.createInferenceFailure(
        RuleExpressionTypeValidationDiagnosticCode.InvalidOperandType,
        `Operator "${operator}" requires compatible operands, received ${this.formatType(leftType)} and ${this.formatType(rightType)}.`,
      );
    }

    return {
      inferredType: RuleExpressionTypeValidatorService.booleanType,
      isSuccess: true,
    };
  }

  private inferUnaryExpressionType(
    ast: jsep.UnaryExpression,
    contextSchema: ContextSchemaDefinition,
  ): RuleExpressionTypeInferenceResult {
    const argumentResult = this.inferType(ast.argument, contextSchema);

    if (!argumentResult.isSuccess) {
      return argumentResult;
    }

    switch (ast.operator) {
      case '!':
        if (this.hasExactlyType(argumentResult.inferredType, RuleExpressionValueType.Boolean)) {
          return {
            inferredType: RuleExpressionTypeValidatorService.booleanType,
            isSuccess: true,
          };
        }

        return this.createInvalidUnaryOperandTypeFailure(
          ast.operator,
          RuleExpressionValueType.Boolean,
          argumentResult.inferredType,
        );
      case '-':
        if (this.hasExactlyType(argumentResult.inferredType, RuleExpressionValueType.Number)) {
          return {
            inferredType: RuleExpressionTypeValidatorService.numberType,
            isSuccess: true,
          };
        }

        return this.createInvalidUnaryOperandTypeFailure(
          ast.operator,
          RuleExpressionValueType.Number,
          argumentResult.inferredType,
        );
      default:
        return this.createInferenceFailure(
          RuleExpressionTypeValidationDiagnosticCode.UnsupportedNode,
          `Unary operator "${ast.operator}" is not supported for type validation.`,
        );
    }
  }

  private getContextValueType(node: ContextSchemaValueNode): RuleExpressionInferredType {
    const valueTypes: RuleExpressionValueType[] = [];

    switch (node.valueType) {
      case ContextSchemaValueType.Boolean:
        valueTypes.push(RuleExpressionValueType.Boolean);
        break;
      case ContextSchemaValueType.Number:
        valueTypes.push(RuleExpressionValueType.Number);
        break;
      case ContextSchemaValueType.String:
        valueTypes.push(RuleExpressionValueType.String);
        break;
    }

    if (node.nullable || node.optional) {
      valueTypes.push(RuleExpressionValueType.Null);
    }

    return {valueTypes};
  }

  private mergeConditionalBranchTypes(
    consequentType: RuleExpressionInferredType,
    alternateType: RuleExpressionInferredType,
  ): RuleExpressionInferredType | undefined {
    const consequentNonNullTypes = consequentType.valueTypes.filter(
      (valueType) => valueType !== RuleExpressionValueType.Null,
    );
    const alternateNonNullTypes = alternateType.valueTypes.filter(
      (valueType) => valueType !== RuleExpressionValueType.Null,
    );

    if (
      consequentNonNullTypes.length > 0 &&
      alternateNonNullTypes.length > 0 &&
      !this.haveSameTypes(consequentNonNullTypes, alternateNonNullTypes)
    ) {
      return undefined;
    }

    return {
      valueTypes: this.uniqueTypes([...consequentType.valueTypes, ...alternateType.valueTypes]),
    };
  }

  private hasExactlyType(
    inferredType: RuleExpressionInferredType,
    expectedType: RuleExpressionValueType,
  ): boolean {
    return inferredType.valueTypes.length === 1 && inferredType.valueTypes[0] === expectedType;
  }

  private hasSharedType(
    leftType: RuleExpressionInferredType,
    rightType: RuleExpressionInferredType,
  ): boolean {
    return leftType.valueTypes.some((valueType) => rightType.valueTypes.includes(valueType));
  }

  private haveSameTypes(
    firstTypes: readonly RuleExpressionValueType[],
    secondTypes: readonly RuleExpressionValueType[],
  ): boolean {
    return (
      firstTypes.length === secondTypes.length &&
      firstTypes.every((type) => secondTypes.includes(type))
    );
  }

  private uniqueTypes(
    valueTypes: readonly RuleExpressionValueType[],
  ): readonly RuleExpressionValueType[] {
    return [...new Set(valueTypes)];
  }

  private formatType(inferredType: RuleExpressionInferredType): string {
    return inferredType.valueTypes.join(' | ');
  }

  private createInvalidOperandTypeFailure(
    operator: string,
    expectedType: RuleExpressionValueType,
    leftType: RuleExpressionInferredType,
    rightType: RuleExpressionInferredType,
  ): RuleExpressionTypeInferenceFailure {
    return this.createInferenceFailure(
      RuleExpressionTypeValidationDiagnosticCode.InvalidOperandType,
      `Operator "${operator}" requires ${expectedType} operands, received ${this.formatType(leftType)} and ${this.formatType(rightType)}.`,
    );
  }

  private createInvalidUnaryOperandTypeFailure(
    operator: string,
    expectedType: RuleExpressionValueType,
    argumentType: RuleExpressionInferredType,
  ): RuleExpressionTypeInferenceFailure {
    return this.createInferenceFailure(
      RuleExpressionTypeValidationDiagnosticCode.InvalidOperandType,
      `Unary operator "${operator}" requires a ${expectedType} operand, received ${this.formatType(argumentType)}.`,
    );
  }

  private createInferenceFailure(
    code: RuleExpressionTypeValidationDiagnosticCode,
    message: string,
  ): RuleExpressionTypeInferenceFailure {
    return {
      diagnostic: {code, message},
      isSuccess: false,
    };
  }

  private createInferenceFailureFromDiagnostic(
    diagnostic: RuleExpressionTypeInferenceFailure['diagnostic'],
  ): RuleExpressionTypeInferenceFailure {
    return {
      diagnostic,
      isSuccess: false,
    };
  }
}

export {type IRuleExpressionTypeValidatorService, RuleExpressionTypeValidatorService};
