---
phase: 01
status: clean
reviewed: 2026-04-21
---

# Code Review — Phase 1: Foundation

## Security

| Check | Result |
|-------|--------|
| Hardcoded credentials | ✓ None — all via `process.env.*` |
| Cypher injection | ✓ All queries use parameterized inputs |
| Input validation | ✓ Zod schemas on all POST endpoints |
| Error message leakage | ✓ Generic messages returned to client; details logged server-side |
| Secrets in `.gitignore` | ✓ `.env` excluded; `.env.example` committed safely |

## Bug Checks

| File | Check | Result |
|------|-------|--------|
| `src/db/neo4j.ts` | Session leak on error | ✓ `finally { session.close() }` in all model methods |
| `src/db/neo4j.ts` | Driver null check | ✓ Singleton init guards correctly |
| `src/db/schema.ts` | Missing `dotenv/config` for CLI run | ✓ `import 'dotenv/config'` at top |
| `src/models/relationship.ts` | MERGE creates if not exists — correct idempotency | ✓ |
| `src/api/*/route.ts` | Unhandled async errors | ✓ All handlers wrapped in try/catch |
| `tests/integration/graph.test.ts` | Driver left open after tests | ✓ `closeDriver()` in `afterAll` |

## Code Quality

| Concern | Assessment |
|---------|------------|
| Separation of concerns | ✓ Model / Route / Type layers cleanly separated |
| TypeScript strictness | ✓ `strict: true` in tsconfig; no `any` types |
| Consistent error shapes | ✓ `{ error: string, details?: ... }` pattern throughout |
| Session lifecycle | ✓ All sessions opened and closed in same function scope |
| UUIDs as surrogate keys | ✓ `uuid.v4()` used — no Neo4j internal IDs exposed |
| `DETACH DELETE` in tests | ✓ Cleans edges + nodes correctly |

## Minor Observations (Non-Blocking)

1. **`relationship.ts` MERGE behavior**: The MERGE uses `{userId, skillId}` as the relationship identifier, which is correct for preventing duplicate edges. However, `ON CREATE SET` means `proficiency` won't update if the edge already exists — this is intentional for idempotency but should be documented (it is, via code comments).

2. **`neo4j.ts` startup guard**: The `NEO4J_PASSWORD` guard throws at module load time, which will crash the test suite if `.env` is missing. This is correct production behaviour — tests need a real DB anyway.

3. **No request ID / correlation headers**: Low priority for Phase 1 — recommended for Phase 2+ when debugging distributed API calls.

## Verdict: ✅ CLEAN

No blocking issues. No security vulnerabilities. No logic bugs found.
