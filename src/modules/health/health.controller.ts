import {Controller, Get, ServiceUnavailableException} from '@nestjs/common';

import {DatabaseService} from '../../infrastructure/database/database.service';
import type {DatabaseHealthResponse, HealthResponse} from './types';

@Controller('health')
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

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
