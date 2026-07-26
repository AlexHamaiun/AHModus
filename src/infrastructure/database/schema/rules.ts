import {
  type AnyPgColumn,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import {RuleVersionValidationStatus} from '../../../modules/rules/enums';
import type {IRuleVersionValidationResult} from '../../../modules/rules/interfaces';

const ruleVersionValidationStatusEnum = pgEnum('rule_version_validation_status', [
  RuleVersionValidationStatus.Pending,
  RuleVersionValidationStatus.Valid,
  RuleVersionValidationStatus.Invalid,
]);

const rules = pgTable(
  'rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    key: varchar('key', {length: 128}).notNull(),
    name: varchar('name', {length: 255}).notNull(),
    description: text('description'),
    activeVersionId: uuid('active_version_id').references((): AnyPgColumn => ruleVersions.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', {mode: 'date', withTimezone: true}).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', {mode: 'date', withTimezone: true}).defaultNow().notNull(),
    archivedAt: timestamp('archived_at', {mode: 'date', withTimezone: true}),
  },
  (table) => [uniqueIndex('rules_key_unique').on(table.key)],
);

const ruleVersions = pgTable(
  'rule_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ruleId: uuid('rule_id')
      .notNull()
      .references((): AnyPgColumn => rules.id, {onDelete: 'restrict'}),
    version: integer('version').notNull(),
    expression: text('expression').notNull(),
    validationStatus: ruleVersionValidationStatusEnum('validation_status')
      .default(RuleVersionValidationStatus.Pending)
      .notNull(),
    validationResult: jsonb('validation_result').$type<IRuleVersionValidationResult>(),
    createdAt: timestamp('created_at', {mode: 'date', withTimezone: true}).defaultNow().notNull(),
    createdBy: varchar('created_by', {length: 255}),
    publishedAt: timestamp('published_at', {mode: 'date', withTimezone: true}),
  },
  (table) => [uniqueIndex('rule_versions_rule_id_version_unique').on(table.ruleId, table.version)],
);

export {ruleVersionValidationStatusEnum, rules, ruleVersions};
