import {Inject, Injectable} from '@nestjs/common';
import {and, asc, desc, eq, isNull} from 'drizzle-orm';

import {Service} from '../../common/enums';
import {DatabaseAssertions} from '../../infrastructure/database/assertions/database.assertions';
import {BaseRepository} from '../../infrastructure/database/base.repository';
import type {IDatabaseService} from '../../infrastructure/database/database.service';
import type {IBaseRepository} from '../../infrastructure/database/interfaces';
import {contextSchemas, contextSchemaVersions} from '../../infrastructure/database/schema';
import {ContextSchemaEntityName} from './enums';
import type {
  ContextSchema,
  ContextSchemaDraft,
  ContextSchemaVersion,
  CreateContextSchemaInput,
  CreateContextSchemaVersionInput,
  UpdateContextSchemaInput,
} from './types';

interface IContextSchemasRepository extends IBaseRepository<
  ContextSchema,
  CreateContextSchemaInput,
  UpdateContextSchemaInput,
  ContextSchemaDraft
> {
  createNextVersion(
    contextSchemaId: string,
    input: CreateContextSchemaVersionInput,
  ): Promise<ContextSchemaVersion>;
  activateVersion(contextSchemaId: string, versionId: string): Promise<ContextSchema>;
  findActiveVersionByContextSchemaId(
    contextSchemaId: string,
  ): Promise<ContextSchemaVersion | undefined>;
  findByKey(key: string): Promise<ContextSchema | undefined>;
  findByKeyForUpdate(key: string): Promise<ContextSchema | undefined>;
  findVersionsByContextSchemaId(contextSchemaId: string): Promise<readonly ContextSchemaVersion[]>;
}

@Injectable()
class ContextSchemasRepository
  extends BaseRepository<
    ContextSchema,
    CreateContextSchemaInput,
    UpdateContextSchemaInput,
    ContextSchemaDraft
  >
  implements IContextSchemasRepository
{
  constructor(@Inject(Service.Database) databaseService: IDatabaseService) {
    super(databaseService);
  }

  async create(input: CreateContextSchemaInput): Promise<ContextSchemaDraft> {
    const insertedContextSchemas = await this.database
      .insert(contextSchemas)
      .values({
        description: input.description,
        key: input.key,
        name: input.name,
      })
      .returning();

    const contextSchema = DatabaseAssertions.requireSingleResult(
      insertedContextSchemas,
      ContextSchemaEntityName.ContextSchema,
    );

    const version = await this.createNextVersion(contextSchema.id, {
      createdBy: input.createdBy,
      definition: input.definition,
    });

    const activatedContextSchema = await this.activateVersion(contextSchema.id, version.id);

    return {
      contextSchema: activatedContextSchema,
      version,
    };
  }

  async createNextVersion(
    contextSchemaId: string,
    input: CreateContextSchemaVersionInput,
  ): Promise<ContextSchemaVersion> {
    const [latestVersion] = await this.database
      .select({version: contextSchemaVersions.version})
      .from(contextSchemaVersions)
      .where(eq(contextSchemaVersions.contextSchemaId, contextSchemaId))
      .orderBy(desc(contextSchemaVersions.version))
      .limit(1);
    const nextVersion = latestVersion === undefined ? 1 : latestVersion.version + 1;

    const insertedContextSchemaVersions = await this.database
      .insert(contextSchemaVersions)
      .values({
        contextSchemaId,
        createdBy: input.createdBy,
        definition: input.definition,
        version: nextVersion,
      })
      .returning();

    return DatabaseAssertions.requireSingleResult(
      insertedContextSchemaVersions,
      ContextSchemaEntityName.ContextSchemaVersion,
    );
  }

  async activateVersion(contextSchemaId: string, versionId: string): Promise<ContextSchema> {
    const activatedContextSchemas = await this.database
      .update(contextSchemas)
      .set({
        activeVersionId: versionId,
        updatedAt: new Date(),
      })
      .where(and(eq(contextSchemas.id, contextSchemaId), isNull(contextSchemas.archivedAt)))
      .returning();

    return DatabaseAssertions.requireSingleResult(
      activatedContextSchemas,
      ContextSchemaEntityName.ContextSchema,
    );
  }

  async findAll(): Promise<readonly ContextSchema[]> {
    return this.database
      .select()
      .from(contextSchemas)
      .where(isNull(contextSchemas.archivedAt))
      .orderBy(asc(contextSchemas.createdAt));
  }

  async findById(id: string): Promise<ContextSchema | undefined> {
    const [contextSchema] = await this.database
      .select()
      .from(contextSchemas)
      .where(and(eq(contextSchemas.id, id), isNull(contextSchemas.archivedAt)));

    return contextSchema;
  }

  async findByKey(key: string): Promise<ContextSchema | undefined> {
    const [contextSchema] = await this.database
      .select()
      .from(contextSchemas)
      .where(and(eq(contextSchemas.key, key), isNull(contextSchemas.archivedAt)));

    return contextSchema;
  }

  async findByKeyForUpdate(key: string): Promise<ContextSchema | undefined> {
    const [contextSchema] = await this.database
      .select()
      .from(contextSchemas)
      .where(and(eq(contextSchemas.key, key), isNull(contextSchemas.archivedAt)))
      .for('update');

    return contextSchema;
  }

  async findActiveVersionByContextSchemaId(
    contextSchemaId: string,
  ): Promise<ContextSchemaVersion | undefined> {
    const [result] = await this.database
      .select({version: contextSchemaVersions})
      .from(contextSchemas)
      .innerJoin(
        contextSchemaVersions,
        eq(contextSchemas.activeVersionId, contextSchemaVersions.id),
      )
      .where(and(eq(contextSchemas.id, contextSchemaId), isNull(contextSchemas.archivedAt)));

    return result?.version;
  }

  async findVersionsByContextSchemaId(
    contextSchemaId: string,
  ): Promise<readonly ContextSchemaVersion[]> {
    return this.database
      .select()
      .from(contextSchemaVersions)
      .where(eq(contextSchemaVersions.contextSchemaId, contextSchemaId))
      .orderBy(asc(contextSchemaVersions.version));
  }

  async remove(id: string): Promise<ContextSchema> {
    const archivedContextSchemas = await this.database
      .update(contextSchemas)
      .set({
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(contextSchemas.id, id), isNull(contextSchemas.archivedAt)))
      .returning();

    return DatabaseAssertions.requireSingleResult(
      archivedContextSchemas,
      ContextSchemaEntityName.ContextSchema,
    );
  }

  async update(id: string, input: UpdateContextSchemaInput): Promise<ContextSchema> {
    const updatedContextSchemas = await this.database
      .update(contextSchemas)
      .set({
        description: input.description,
        name: input.name,
        updatedAt: new Date(),
      })
      .where(and(eq(contextSchemas.id, id), isNull(contextSchemas.archivedAt)))
      .returning();

    return DatabaseAssertions.requireSingleResult(
      updatedContextSchemas,
      ContextSchemaEntityName.ContextSchema,
    );
  }
}

export {type IContextSchemasRepository, ContextSchemasRepository};
