import {Module} from '@nestjs/common';

import {Repository, Service} from '../../common/enums';
import {ContextSchemasController} from './context-schemas.controller';
import {ContextSchemasRepository} from './context-schemas.repository';
import {ContextSchemasService} from './context-schemas.service';
import {ContextSchemaDefinitionValidatorService} from './context-schema-definition-validator.service';

@Module({
  controllers: [ContextSchemasController],
  providers: [
    {
      provide: Repository.ContextSchemas,
      useClass: ContextSchemasRepository,
    },
    {
      provide: Service.ContextSchemaDefinitionValidator,
      useClass: ContextSchemaDefinitionValidatorService,
    },
    {
      provide: Service.ContextSchemas,
      useClass: ContextSchemasService,
    },
  ],
  exports: [Service.ContextSchemas],
})
class ContextSchemasModule {}

export {ContextSchemasModule};
