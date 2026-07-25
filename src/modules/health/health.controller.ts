import {Controller, Get} from '@nestjs/common';

type HealthResponse = {
  readonly status: 'ok';
  readonly service: 'ahmodus-api';
  readonly timestamp: string;
};

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'ahmodus-api',
      timestamp: new Date().toISOString(),
    };
  }
}
