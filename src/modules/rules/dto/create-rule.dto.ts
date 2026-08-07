import {IsNotEmpty, IsOptional, IsString, Matches, MaxLength} from 'class-validator';

class CreateRuleDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/u, {
    message: 'contextSchemaKey must contain only lowercase letters, numbers, and underscores',
  })
  @MaxLength(128)
  readonly contextSchemaKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly description?: string;

  @IsString()
  @IsNotEmpty()
  readonly expression!: string;

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

export {CreateRuleDto};
