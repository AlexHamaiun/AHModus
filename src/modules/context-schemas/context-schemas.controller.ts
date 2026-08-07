import {Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post} from '@nestjs/common';

import {BaseController} from '../../common/base.controller';
import {Resource, Service} from '../../common/enums';
import {CreateContextSchemaDto} from './dto/create-context-schema.dto';
import {CreateContextSchemaVersionDto} from './dto/create-context-schema-version.dto';
import type {IContextSchemasService} from './context-schemas.service';
import type {
  ContextSchema,
  ContextSchemaDraft,
  ContextSchemaVersion,
  CreateContextSchemaInput,
  UpdateContextSchemaInput,
} from './types';

@Controller(Resource.ContextSchemas)
class ContextSchemasController extends BaseController<
  ContextSchema,
  CreateContextSchemaInput,
  UpdateContextSchemaInput,
  ContextSchemaDraft
> {
  constructor(
    @Inject(Service.ContextSchemas)
    private readonly contextSchemasService: IContextSchemasService,
  ) {
    super(contextSchemasService);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createContextSchema(
    @Body() createContextSchemaDto: CreateContextSchemaDto,
  ): Promise<ContextSchemaDraft> {
    return this.create(createContextSchemaDto);
  }

  @Post(':key/versions')
  @HttpCode(HttpStatus.CREATED)
  createContextSchemaVersion(
    @Param('key') key: string,
    @Body() createContextSchemaVersionDto: CreateContextSchemaVersionDto,
  ): Promise<ContextSchemaVersion> {
    return this.contextSchemasService.createVersionByContextSchemaKey(
      key,
      createContextSchemaVersionDto,
    );
  }

  @Get()
  findContextSchemas(): Promise<readonly ContextSchema[]> {
    return this.findAll();
  }

  @Get(':key/versions')
  findContextSchemaVersionsByKey(
    @Param('key') key: string,
  ): Promise<readonly ContextSchemaVersion[]> {
    return this.contextSchemasService.findVersionsByContextSchemaKey(key);
  }

  @Get(':key')
  findContextSchemaByKey(@Param('key') key: string): Promise<ContextSchema> {
    return this.contextSchemasService.findByKey(key);
  }
}

export {ContextSchemasController};
