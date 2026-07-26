import type {IEnvironmentVariables} from './interfaces';

export function validateEnvironment(config: Record<string, unknown>): IEnvironmentVariables {
  const databaseUrl = getRequiredString(config, 'DATABASE_URL');
  const port = getPort(config.PORT);

  return {
    DATABASE_URL: databaseUrl,
    PORT: port,
  };
}

function getRequiredString(config: Record<string, unknown>, name: string): string {
  const value = config[name];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Required environment variable is missing: ${name}`);
  }

  return value.trim();
}

function getPort(value: unknown): number {
  if (value === undefined || value === '') {
    return 3000;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}
