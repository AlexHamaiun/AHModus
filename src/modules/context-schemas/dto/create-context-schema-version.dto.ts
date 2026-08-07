import {IsObject} from 'class-validator';

import type {ContextSchemaDefinition} from '../types';

class CreateContextSchemaVersionDto {
  @IsObject()
  readonly definition!: ContextSchemaDefinition;
}

export {CreateContextSchemaVersionDto};
