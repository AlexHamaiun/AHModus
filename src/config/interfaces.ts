import type {LogLevel} from './types';

interface IEnvironmentVariables {
  readonly DATABASE_URL: string;
  readonly LOG_LEVEL: LogLevel;
  readonly PORT: number;
}

export {type IEnvironmentVariables};
