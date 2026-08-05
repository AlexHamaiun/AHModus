import {
  type AnyPgColumn,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import type {ContextSchemaDefinition} from '../../../modules/context-schemas/types';

const contextSchemas = pgTable(
  'context_schemas',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    key: varchar('key', {length: 128}).notNull(),
    name: varchar('name', {length: 255}).notNull(),
    description: text('description'),
    activeVersionId: uuid('active_version_id').references(
      (): AnyPgColumn => contextSchemaVersions.id,
      {
        onDelete: 'set null',
      },
    ),
    createdAt: timestamp('created_at', {mode: 'date', withTimezone: true}).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', {mode: 'date', withTimezone: true}).defaultNow().notNull(),
    archivedAt: timestamp('archived_at', {mode: 'date', withTimezone: true}),
  },
  (table) => [uniqueIndex('context_schemas_key_unique').on(table.key)],
);

const contextSchemaVersions = pgTable(
  'context_schema_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contextSchemaId: uuid('context_schema_id')
      .notNull()
      .references((): AnyPgColumn => contextSchemas.id, {onDelete: 'restrict'}),
    version: integer('version').notNull(),
    definition: jsonb('definition').$type<ContextSchemaDefinition>().notNull(),
    createdAt: timestamp('created_at', {mode: 'date', withTimezone: true}).defaultNow().notNull(),
    createdBy: varchar('created_by', {length: 255}),
  },
  (table) => [
    uniqueIndex('context_schema_versions_context_schema_id_version_unique').on(
      table.contextSchemaId,
      table.version,
    ),
  ],
);

export {contextSchemas, contextSchemaVersions};
