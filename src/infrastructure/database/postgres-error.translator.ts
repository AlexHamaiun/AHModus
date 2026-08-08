import {ConflictException} from '@nestjs/common';

import {PostgresErrorCode} from './enums';
import {hasPostgresErrorCode} from './postgres-error.guard';

class PostgresErrorTranslator {
  private constructor() {}

  static rethrowCreateError(error: unknown, duplicateMessage: string): never {
    if (hasPostgresErrorCode(error, PostgresErrorCode.UniqueViolation)) {
      throw new ConflictException(duplicateMessage);
    }

    throw error;
  }
}

export {PostgresErrorTranslator};
