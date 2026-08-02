import {Module} from '@nestjs/common';

import {Service} from '../../common/enums';
import {RuleExpressionAstValidatorService} from './ast/rule-expression-ast-validator.service';
import {RuleExpressionParserService} from './parser/rule-expression-parser.service';

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
  ],
  exports: [Service.RuleExpressionAstValidator, Service.RuleExpressionParser],
})
class RuleValidationModule {}

export {RuleValidationModule};
