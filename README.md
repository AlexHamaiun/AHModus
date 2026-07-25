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

## Initial module boundaries

- `health` — liveness/readiness endpoint.
- `rules` — rule definitions, versions, publishing and rollback (next milestone).
- Future modules: `ai-authoring`, `simulations`, `audit`, `projects`.

At runtime the SDK will execute a locally cached, prevalidated rule; OpenAI will only
participate in the administrative authoring workflow.
