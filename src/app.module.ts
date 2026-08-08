import {Module} from '@nestjs/common';

import {AppConfigModule} from './config/config.module';
import {DatabaseModule} from './infrastructure/database/database.module';
import {LoggingModule} from './infrastructure/logging/logging.module';
import {ContextSchemasModule} from './modules/context-schemas/context-schemas.module';
import {HealthModule} from './modules/health/health.module';
import {RulesModule} from './modules/rules/rules.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    LoggingModule,
    ContextSchemasModule,
    HealthModule,
    RulesModule,
  ],
})
class AppModule {}

export {AppModule};
