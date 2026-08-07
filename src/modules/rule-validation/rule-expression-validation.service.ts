import {Inject, Injectable} from '@nestjs/common';

import {Service} from '../../common/enums';
import type {ContextSchemaDefinition} from '../context-schemas/types';
import type {IRuleExpressionAstValidatorService} from './ast/rule-expression-ast-validator.service';
import type {IContextSchemaPathValidatorService} from './context-schema-paths/context-schema-path-validator.service';
import type {IRuleExpressionParserService} from './parser/rule-expression-parser.service';
import type {IRuleExpressionTypeValidatorService} from './type/rule-expression-type-validator.service';
import type {RuleExpressionValidationResult} from './types';

interface IRuleExpressionValidationService {
  validate(
    expression: string,
    contextSchema: ContextSchemaDefinition,
  ): RuleExpressionValidationResult;
}

@Injectable()
class RuleExpressionValidationService implements IRuleExpressionValidationService {
  constructor(
    @Inject(Service.RuleExpressionParser)
    private readonly ruleExpressionParserService: IRuleExpressionParserService,
    @Inject(Service.RuleExpressionAstValidator)
    private readonly ruleExpressionAstValidatorService: IRuleExpressionAstValidatorService,
    @Inject(Service.ContextSchemaPathValidator)
    private readonly contextSchemaPathValidatorService: IContextSchemaPathValidatorService,
    @Inject(Service.RuleExpressionTypeValidator)
    private readonly ruleExpressionTypeValidatorService: IRuleExpressionTypeValidatorService,
  ) {}

  validate(
    expression: string,
    contextSchema: ContextSchemaDefinition,
  ): RuleExpressionValidationResult {
    const parseResult = this.ruleExpressionParserService.parse(expression);

    if (!parseResult.isSuccess) {
      return {
        diagnostic: parseResult.diagnostic,
        isValid: false,
      };
    }

    const astValidationResult = this.ruleExpressionAstValidatorService.validate(parseResult.ast);

    if (!astValidationResult.isValid) {
      return astValidationResult;
    }

    const contextPathValidationResult = this.contextSchemaPathValidatorService.validate(
      parseResult.ast,
      contextSchema,
    );

    if (!contextPathValidationResult.isValid) {
      return contextPathValidationResult;
    }

    return this.ruleExpressionTypeValidatorService.validate(parseResult.ast, contextSchema);
  }
}

export {type IRuleExpressionValidationService, RuleExpressionValidationService};
