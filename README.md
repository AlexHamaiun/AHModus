# AHModus API

Backend for **AHModus** — a Dynamic AI Rule Engine where AI helps author business rules,
while validated rules execute deterministically outside the LLM runtime path.

## Requirements

- Node.js `26.5.0`
- npm `11.17.0`

## Start

```bash
npm ci
npm run start:dev
```

The health check is available at `GET /v1/health`.

`package-lock.json` is committed and all package versions are exact. Use `npm ci`
for a reproducible installation; do not use `npm update` without an explicit
dependency-update task and test run.

## Verification

Run the unit test suite:

```powershell
npm.cmd test
```

The current tests cover the DSL parser, AST security validator, Context Schema
path validator and static type validator. They verify that the DSL accepts its
intended expression subset and rejects malformed syntax, multiple expressions,
function calls, unsafe member access, unsupported operators, overly complex
ASTs, unknown context paths and incompatible operand types.

Run the static quality checks before committing changes:

```powershell
npm.cmd run lint
npm.cmd run build
```

## Current DSL validation status

`rule-validation` is an isolated, tested boundary. Its single public validation
pipeline parses exactly one DSL expression, applies a strict AST allowlist,
checks every referenced context path against the developer-defined Context
Schema and validates operator type compatibility before any future evaluator can
consume the expression. The allowed subset includes literals, member access,
arithmetic, comparisons, logical operators and ternary expressions.

The validator does not execute JavaScript. Function calls, computed member
access, prototype-related property names, unsupported operators and expressions
that exceed AST complexity limits are rejected.

API integration is intentionally pending; rule versions remain drafts and are
not marked as validated or published.

## Local PostgreSQL

Copy the local-only environment template and start PostgreSQL with Docker:

```powershell
Copy-Item .env.example .env
npm.cmd run db:up
```

AHModus maps PostgreSQL to host port `5433` by default, leaving the standard
`5432` port available for any PostgreSQL instance already installed on the host.

Check that the container is healthy with `docker compose ps`. Stop it with
`npm.cmd run db:down`; the named Docker volume preserves local database data.
Use `docker compose down -v` only when you deliberately want to remove all local
database data.

NestJS loads and validates `.env` through `ConfigService`; application code reads
environment values through that service rather than directly from `process.env`.
After installing dependencies, verify the database connection at
`GET /v1/health/database`.

For a schema change, first add or update the corresponding Drizzle table
definition in `src/infrastructure/database/schema/`. Then generate a SQL
migration:

```powershell
npm.cmd run db:generate -- --name=create-projects
```

Review the generated file in `drizzle/` and commit it together with the schema
definition. Check generated migration consistency with:

```powershell
npm.cmd run db:check
```

Apply unapplied migrations with:

```powershell
npm.cmd run db:migrate
```

The application uses Drizzle ORM for type-safe database queries and Drizzle Kit
for migration application and bookkeeping. The TypeScript schema declares the
target model; reviewed SQL files in `drizzle/` are its immutable change history.
Never use `db:push` for shared or production environments.

For exceptional changes that Drizzle cannot express (for example a data backfill
or advanced PostgreSQL DDL), create a handwritten SQL migration with:

```powershell
npm.cmd run db:generate:custom -- --name=backfill-rule-status
```

## Initial module boundaries

- `health` — liveness/readiness endpoint.
- `rules` — rule definitions and immutable draft versions.
- `rule-validation` — deterministic DSL parsing and AST security validation.
- Future modules: `ai-authoring`, `simulations`, `audit`, `projects`.

At runtime the SDK will execute a locally cached, prevalidated rule; OpenAI will only
participate in the administrative authoring workflow.
