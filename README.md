# AHModus API

Backend for **AHModus** — a Dynamic AI Rule Engine where AI helps author business rules,
while validated rules execute deterministically outside the LLM runtime path.

## Requirements

- Node.js `26.5.0` or newer
- npm `11.17.0` or newer

## Start

```bash
npm ci
npm run start:dev
```

The health check is available at `GET /v1/health`.

`package-lock.json` is committed and all package versions are exact. Use `npm ci`
for a reproducible installation; do not use `npm update` without an explicit
dependency-update task and test run.

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
- `rules` — rule definitions, versions, publishing and rollback (next milestone).
- Future modules: `ai-authoring`, `simulations`, `audit`, `projects`.

At runtime the SDK will execute a locally cached, prevalidated rule; OpenAI will only
participate in the administrative authoring workflow.
