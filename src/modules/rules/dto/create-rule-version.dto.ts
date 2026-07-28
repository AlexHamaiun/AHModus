import {IsNotEmpty, IsString} from 'class-validator';

class CreateRuleVersionDto {
  @IsString()
  @IsNotEmpty()
  readonly expression!: string;
}

export {CreateRuleVersionDto};
