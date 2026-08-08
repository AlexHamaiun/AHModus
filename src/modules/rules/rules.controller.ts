import {Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post} from '@nestjs/common';

import {BaseController} from '../../common/base.controller';
import {Resource, Service} from '../../common/enums';
import {CreateRuleDto} from './dto/create-rule.dto';
import {CreateRuleVersionDto} from './dto/create-rule-version.dto';
import type {IRulesService} from './rules.service';
import type {CreateRuleInput, Rule, RuleDraft, RuleVersion, UpdateRuleInput} from './types';

@Controller(Resource.Rules)
class RulesController extends BaseController<Rule, CreateRuleInput, UpdateRuleInput> {
  constructor(@Inject(Service.Rules) private readonly rulesService: IRulesService) {
    super(rulesService);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createRule(@Body() createRuleDto: CreateRuleDto): Promise<RuleDraft> {
    return this.rulesService.createByContextSchema(createRuleDto);
  }

  @Post(':key/versions')
  @HttpCode(HttpStatus.CREATED)
  createRuleVersion(
    @Param('key') key: string,
    @Body() createRuleVersionDto: CreateRuleVersionDto,
  ): Promise<RuleVersion> {
    return this.rulesService.createVersionByRuleKey(key, createRuleVersionDto);
  }

  @Get()
  findRules(): Promise<readonly Rule[]> {
    return this.findAll();
  }

  @Get(':key/versions')
  findRuleVersionsByKey(@Param('key') key: string): Promise<readonly RuleVersion[]> {
    return this.rulesService.findVersionsByRuleKey(key);
  }

  @Get(':key')
  findRuleByKey(@Param('key') key: string): Promise<Rule> {
    return this.rulesService.findByKey(key);
  }
}

export {RulesController};
