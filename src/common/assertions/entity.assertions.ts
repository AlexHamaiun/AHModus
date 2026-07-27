import {NotFoundException} from '@nestjs/common';

class EntityAssertions {
  private constructor() {}

  static require<TEntity>(
    entity: TEntity | undefined,
    entityName: string,
    identifierName: string,
    identifierValue: string,
  ): TEntity {
    if (entity === undefined) {
      throw new NotFoundException(
        `Entity "${entityName}" with ${identifierName} "${identifierValue}" was not found.`,
      );
    }

    return entity;
  }
}

export {EntityAssertions};
