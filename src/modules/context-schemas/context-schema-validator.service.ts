import {Injectable} from '@nestjs/common';

import {
  ContextSchemaNodeKind,
  ContextSchemaValidationDiagnosticCode,
  ContextSchemaValidationLimit,
  ContextSchemaValueType,
} from './enums';
import type {
  ContextSchemaDefinition,
  ContextSchemaValidationCheckResult,
  ContextSchemaValidationDiagnostic,
  ContextSchemaValidationFailure,
  ContextSchemaValidationResult,
  ContextSchemaValidationState,
} from './types';

interface IContextSchemaValidatorService {
  validate(contextSchema: unknown): ContextSchemaValidationResult;
}

@Injectable()
class ContextSchemaValidatorService implements IContextSchemaValidatorService {
  private readonly unsafeContextPropertyNames = new Set(['__proto__', 'constructor', 'prototype']);

  validate(contextSchema: unknown): ContextSchemaValidationResult {
    const validationState: ContextSchemaValidationState = {nodeCount: 0};
    const validationResult = this.validateNode(contextSchema, '$', 0, true, validationState);

    if (!validationResult.isValid) {
      return validationResult;
    }

    return {
      contextSchema: contextSchema as ContextSchemaDefinition,
      isValid: true,
    };
  }

  private validateNode(
    node: unknown,
    path: string,
    depth: number,
    isRoot: boolean,
    validationState: ContextSchemaValidationState,
  ): ContextSchemaValidationCheckResult {
    const maxDepth = Number(ContextSchemaValidationLimit.MaxDepth);

    if (depth > maxDepth) {
      return this.failure(
        ContextSchemaValidationDiagnosticCode.MaxDepthExceeded,
        `Context schema exceeds the maximum depth of ${maxDepth}.`,
      );
    }

    validationState.nodeCount += 1;

    const maxNodeCount = Number(ContextSchemaValidationLimit.MaxNodeCount);

    if (validationState.nodeCount > maxNodeCount) {
      return this.failure(
        ContextSchemaValidationDiagnosticCode.MaxNodeCountExceeded,
        `Context schema exceeds the maximum node count of ${maxNodeCount}.`,
      );
    }

    if (!this.isRecord(node)) {
      return this.failure(
        ContextSchemaValidationDiagnosticCode.InvalidNode,
        `Context schema node at "${path}" must be an object.`,
      );
    }

    const nodeKind = this.getContextSchemaNodeKind(node.kind);

    if (isRoot && nodeKind !== ContextSchemaNodeKind.Object) {
      return this.failure(
        ContextSchemaValidationDiagnosticCode.InvalidRootNode,
        'The context schema root must be an object node.',
      );
    }

    if (nodeKind === ContextSchemaNodeKind.Object) {
      return this.validateObjectNode(node, path, depth, isRoot, validationState);
    }

    if (nodeKind === ContextSchemaNodeKind.Value) {
      return this.validateValueNode(node, path, isRoot);
    }

    return this.failure(
      ContextSchemaValidationDiagnosticCode.InvalidNode,
      `Context schema node at "${path}" must define a supported kind.`,
    );
  }

  private validateObjectNode(
    node: Record<string, unknown>,
    path: string,
    depth: number,
    isRoot: boolean,
    validationState: ContextSchemaValidationState,
  ): ContextSchemaValidationCheckResult {
    const allowedProperties = isRoot
      ? ['kind', 'properties']
      : ['kind', 'nullable', 'optional', 'properties'];
    const unexpectedPropertyResult = this.validateAllowedProperties(node, allowedProperties, path);

    if (!unexpectedPropertyResult.isValid) {
      return unexpectedPropertyResult;
    }

    if (!isRoot) {
      const optionsResult = this.validateNodeOptions(node, path);

      if (!optionsResult.isValid) {
        return optionsResult;
      }
    }

    if (!this.isRecord(node.properties)) {
      return this.failure(
        ContextSchemaValidationDiagnosticCode.InvalidNode,
        `Object context schema node at "${path}" must define an object "properties" field.`,
      );
    }

    for (const [propertyName, childNode] of Object.entries(node.properties)) {
      if (!this.isContextPropertyName(propertyName)) {
        return this.failure(
          ContextSchemaValidationDiagnosticCode.InvalidPropertyName,
          `Context property "${this.toChildPath(path, propertyName)}" must be a valid DSL identifier.`,
        );
      }

      const childResult = this.validateNode(
        childNode,
        this.toChildPath(path, propertyName),
        depth + 1,
        false,
        validationState,
      );

      if (!childResult.isValid) {
        return childResult;
      }
    }

    return {isValid: true};
  }

  private validateValueNode(
    node: Record<string, unknown>,
    path: string,
    isRoot: boolean,
  ): ContextSchemaValidationCheckResult {
    if (isRoot) {
      return this.failure(
        ContextSchemaValidationDiagnosticCode.InvalidRootNode,
        'The context schema root must be an object node.',
      );
    }

    const unexpectedPropertyResult = this.validateAllowedProperties(
      node,
      ['kind', 'nullable', 'optional', 'valueType'],
      path,
    );

    if (!unexpectedPropertyResult.isValid) {
      return unexpectedPropertyResult;
    }

    const optionsResult = this.validateNodeOptions(node, path);

    if (!optionsResult.isValid) {
      return optionsResult;
    }

    if (!this.isContextSchemaValueType(node.valueType)) {
      return this.failure(
        ContextSchemaValidationDiagnosticCode.InvalidNode,
        `Value context schema node at "${path}" must define a supported "valueType".`,
      );
    }

    return {isValid: true};
  }

  private validateAllowedProperties(
    node: Record<string, unknown>,
    allowedProperties: readonly string[],
    path: string,
  ): ContextSchemaValidationCheckResult {
    for (const propertyName of Object.keys(node)) {
      if (!allowedProperties.includes(propertyName)) {
        return this.failure(
          ContextSchemaValidationDiagnosticCode.UnexpectedNodeProperty,
          `Context schema node at "${path}" does not support property "${propertyName}".`,
        );
      }
    }

    return {isValid: true};
  }

  private validateNodeOptions(
    node: Record<string, unknown>,
    path: string,
  ): ContextSchemaValidationCheckResult {
    for (const optionName of ['nullable', 'optional']) {
      if (optionName in node && typeof node[optionName] !== 'boolean') {
        return this.failure(
          ContextSchemaValidationDiagnosticCode.InvalidNode,
          `Context schema option "${optionName}" at "${path}" must be a boolean.`,
        );
      }
    }

    return {isValid: true};
  }

  private failure(
    code: ContextSchemaValidationDiagnosticCode,
    message: string,
  ): ContextSchemaValidationFailure {
    const diagnostic: ContextSchemaValidationDiagnostic = {code, message};

    return {diagnostic, isValid: false};
  }

  private isContextPropertyName(propertyName: string): boolean {
    return (
      /^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(propertyName) &&
      !this.unsafeContextPropertyNames.has(propertyName)
    );
  }

  private getContextSchemaNodeKind(value: unknown): ContextSchemaNodeKind | undefined {
    switch (value) {
      case 'object':
        return ContextSchemaNodeKind.Object;
      case 'value':
        return ContextSchemaNodeKind.Value;
      default:
        return undefined;
    }
  }

  private isContextSchemaValueType(valueType: unknown): valueType is ContextSchemaValueType {
    return Object.values(ContextSchemaValueType).includes(valueType as ContextSchemaValueType);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private toChildPath(parentPath: string, propertyName: string): string {
    return parentPath === '$' ? propertyName : `${parentPath}.${propertyName}`;
  }
}

export {type IContextSchemaValidatorService, ContextSchemaValidatorService};
