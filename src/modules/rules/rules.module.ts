import {Module} from '@nestjs/common';

import {Repository, Service} from '../../common/enums';
import {ContextSchemasModule} from '../context-schemas/context-schemas.module';
import {RuleValidationModule} from '../rule-validation/rule-validation.module';
import {RulesController} from './rules.controller';
import {RulesRepository} from './rules.repository';
import {RulesService} from './rules.service';

@Module({
  imports: [ContextSchemasModule, RuleValidationModule],
  controllers: [RulesController],
  providers: [
    {
      provide: Repository.Rules,
      useClass: RulesRepository,
    },
    {
      provide: Service.Rules,
      useClass: RulesService,
    },
  ],
  exports: [Service.Rules],
})
class RulesModule {}

export {RulesModule};
