import {Module} from '@nestjs/common';

import {Service} from '../../common/enums';
import {RuleExpressionAstValidatorService} from './ast/rule-expression-ast-validator.service';
import {ContextSchemaPathResolverService} from './context/context-schema-path-resolver.service';
import {ContextSchemaPathValidatorService} from './context/context-schema-path-validator.service';
import {RuleExpressionParserService} from './parser/rule-expression-parser.service';
import {RuleExpressionTypeValidatorService} from './type/rule-expression-type-validator.service';
import {RuleExpressionValidationService} from './rule-expression-validation.service';

@Module({
  providers: [
    {
      provide: Service.RuleExpressionParser,
      useClass: RuleExpressionParserService,
    },
    {
      provide: Service.RuleExpressionAstValidator,
      useClass: RuleExpressionAstValidatorService,
    },
    {
      provide: Service.ContextSchemaPathResolver,
      useClass: ContextSchemaPathResolverService,
    },
    {
      provide: Service.ContextSchemaPathValidator,
      useClass: ContextSchemaPathValidatorService,
    },
    {
      provide: Service.RuleExpressionTypeValidator,
      useClass: RuleExpressionTypeValidatorService,
    },
    {
      provide: Service.RuleExpressionValidation,
      useClass: RuleExpressionValidationService,
    },
  ],
  exports: [Service.RuleExpressionValidation],
})
class RuleValidationModule {}

export {RuleValidationModule};
