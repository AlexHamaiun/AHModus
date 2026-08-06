import {IsNotEmpty, IsObject, IsOptional, IsString, Matches, MaxLength} from 'class-validator';

import type {ContextSchemaDefinition} from '../types';

class CreateContextSchemaDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly description?: string;

  @IsObject()
  readonly definition!: ContextSchemaDefinition;

  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/u, {
    message: 'key must contain only lowercase letters, numbers, and underscores',
  })
  @MaxLength(128)
  readonly key!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly name!: string;
}

export {CreateContextSchemaDto};
