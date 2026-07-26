import {Body, Controller, HttpCode, HttpStatus, Inject, Post} from '@nestjs/common';

import {BaseController} from '../../common/base.controller';
import {Resource, Service} from '../../common/enums';
import {CreateRuleDto} from './dto/create-rule.dto';
import type {IRulesService} from './rules.service';
import type {CreateRuleInput, Rule, RuleDraft, UpdateRuleInput} from './types';

@Controller(Resource.Rules)
export class RulesController extends BaseController<
  Rule,
  CreateRuleInput,
  UpdateRuleInput,
  RuleDraft
> {
  constructor(@Inject(Service.Rules) rulesService: IRulesService) {
    super(rulesService);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createRule(@Body() createRuleDto: CreateRuleDto): Promise<RuleDraft> {
    return this.create(createRuleDto);
  }
}
