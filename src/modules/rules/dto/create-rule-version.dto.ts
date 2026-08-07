import {IsNotEmpty, IsString, Matches, MaxLength} from 'class-validator';

class CreateRuleVersionDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/u, {
    message: 'contextSchemaKey must contain only lowercase letters, numbers, and underscores',
  })
  @MaxLength(128)
  readonly contextSchemaKey!: string;

  @IsString()
  @IsNotEmpty()
  readonly expression!: string;
}

export {CreateRuleVersionDto};
