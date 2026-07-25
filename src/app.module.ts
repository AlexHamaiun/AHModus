import {Module} from '@nestjs/common';

import {AppConfigModule} from './config/config.module';
import {DatabaseModule} from './infrastructure/database/database.module';
import {HealthModule} from './modules/health/health.module';
import {RulesModule} from './modules/rules/rules.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, HealthModule, RulesModule],
})
export class AppModule {}
