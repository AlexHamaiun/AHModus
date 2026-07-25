import {Module} from '@nestjs/common';

import {HealthModule} from './modules/health/health.module';
import {RulesModule} from './modules/rules/rules.module';

@Module({
  imports: [HealthModule, RulesModule],
})
export class AppModule {}
