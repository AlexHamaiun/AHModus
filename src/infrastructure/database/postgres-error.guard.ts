import type {IPostgresError} from './interfaces';

function isPostgresError(error: unknown): error is IPostgresError {
  return (
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
  );
}

function hasPostgresErrorCode(error: unknown, code: string): boolean {
  return isPostgresError(error) && error.code === code;
}

export {hasPostgresErrorCode};
