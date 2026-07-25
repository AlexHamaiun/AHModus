type HealthResponse = {
  readonly status: 'ok';
  readonly service: 'ahmodus-api';
  readonly timestamp: string;
};

type DatabaseHealthResponse = {
  readonly status: 'ok';
  readonly database: 'postgresql';
};

export {type DatabaseHealthResponse, type HealthResponse};
