import {Controller, Get, Inject, ServiceUnavailableException} from '@nestjs/common';

import {Resource, Service} from '../../common/enums';
import type {IDatabaseService} from '../../infrastructure/database/database.service';
import type {DatabaseHealthResponse, HealthResponse} from './types';

@Controller(Resource.Health)
export class HealthController {
  constructor(@Inject(Service.Database) private readonly databaseService: IDatabaseService) {}

  @Get()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'ahmodus-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('database')
  async getDatabaseHealth(): Promise<DatabaseHealthResponse> {
    try {
      await this.databaseService.checkConnection();
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'postgresql',
      });
    }

    return {
      status: 'ok',
      database: 'postgresql',
    };
  }
}
