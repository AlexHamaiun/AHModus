import {Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post} from '@nestjs/common';

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
  constructor(@Inject(Service.Rules) private readonly rulesService: IRulesService) {
    super(rulesService);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createRule(@Body() createRuleDto: CreateRuleDto): Promise<RuleDraft> {
    return this.create(createRuleDto);
  }

  @Get()
  findRules(): Promise<readonly Rule[]> {
    return this.findAll();
  }

  @Get(':key')
  findRuleByKey(@Param('key') key: string): Promise<Rule> {
    return this.rulesService.findByKey(key);
  }
}
