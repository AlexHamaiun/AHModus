import {Module} from '@nestjs/common';

import {Service} from '../../common/enums';
import {ContextSchemaValidatorService} from './context-schema-validator.service';

@Module({
  providers: [
    {
      provide: Service.ContextSchemaValidator,
      useClass: ContextSchemaValidatorService,
    },
  ],
  exports: [Service.ContextSchemaValidator],
})
class ContextSchemasModule {}

export {ContextSchemasModule};
