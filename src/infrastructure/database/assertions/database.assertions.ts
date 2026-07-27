import {InternalServerErrorException} from '@nestjs/common';

class DatabaseAssertions {
  private constructor() {}

  static requireSingleResult<TResult>(entities: readonly TResult[], entityName: string): TResult {
    if (entities.length !== 1) {
      throw new InternalServerErrorException(
        `Expected exactly one entity "${entityName}" from the database, received ${entities.length}.`,
      );
    }

    return entities[0]!;
  }
}

export {DatabaseAssertions};
