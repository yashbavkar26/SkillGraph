---
phase: 03-recruiter-search-intelligent-matching
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/types/recruiter/search.ts
  - tests/fixtures/recruiter/search-fixtures.ts
  - tests/integration/recruiter-search.test.ts
  - tests/integration/recruiter-fit-explain.test.ts
  - tests/integration/recruiter-filters.test.ts
  - tests/integration/recruiter-latency.test.ts
autonomous: true
requirements:
  - FR-5
  - FR-6
  - FR-7
  - NFR-1
  - TC-2
must_haves:
  truths:
    - "Recruiter search request/response contracts are explicit and versioned."
    - "Phase 3 recruiter endpoint behaviors are codified in automated tests before implementation."
    - "Latency expectation for recruiter search is captured as an executable check."
  artifacts:
    - path: "src/types/recruiter/search.ts"
      provides: "Typed and zod-validated recruiter query/result contracts."
    - path: "tests/integration/recruiter-search.test.ts"
      provides: "FR-5 search ranking contract tests."
    - path: "tests/integration/recruiter-fit-explain.test.ts"
      provides: "FR-6 fit score + explanation contract tests."
    - path: "tests/integration/recruiter-filters.test.ts"
      provides: "FR-7 contextual filtering tests."
    - path: "tests/integration/recruiter-latency.test.ts"
      provides: "NFR-1 latency smoke test."
  key_links:
    - from: "tests/integration/recruiter-search.test.ts"
      to: "/api/recruiter/search"
      via: "supertest POST request"
      pattern: "request\\(app\\)\\.post\\('/api/recruiter/search'\\)"
    - from: "src/types/recruiter/search.ts"
      to: "tests/fixtures/recruiter/search-fixtures.ts"
      via: "shared contract imports"
      pattern: "import.*recruiter/search"
---

<objective>
Define recruiter matching contracts and a Wave-0 automated validation harness so implementation in later plans is deterministic and regression-resistant.

Purpose: Lock FR-5/FR-6/FR-7/NFR-1 behavior before backend and UI work to avoid contract churn.
Output: Recruiter request/response types + fixtures + integration test scaffolds for search, explainability, filtering, and latency.
Requirements addressed: FR-5, FR-6, FR-7, NFR-1, TC-2.
</objective>

<execution_context>
@C:/Users/Yash/.codex/get-shit-done/workflows/execute-plan.md
@C:/Users/Yash/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/STATE.md
@.planning/phases/03-recruiter-search-intelligent-matching/03-RESEARCH.md
@.planning/phases/03-recruiter-search-intelligent-matching/03-VALIDATION.md

<interfaces>
From src/types/graph.ts:
```typescript
export interface User { id: string; email: string; name: string; createdAt: string; }
export interface Skill { id: string; name: string; category?: string; createdAt: string; }
export interface UserSkillRelationship { userId: string; skillId: string; proficiency?: 1 | 2 | 3 | 4; createdAt: string; }
```

From src/index.ts:
```typescript
export default app;
```
</interfaces>

<source_audit>
GOAL:
- G-03-01: Advanced recruiter search with intelligent matching and explainability.

REQ:
- FR-5, FR-6, FR-7, NFR-1, TC-2 planned in this plan set.

RESEARCH:
- R-03-01: Contract-first sequence before UI build.
- R-03-02: Deterministic score versioning.
- R-03-03: Procedure-compatible retrieval + latency tests.
- R-03-04: Explainability atoms, not opaque strings.
- R-03-05: Wave-0 missing test files must be created.

CONTEXT:
- No CONTEXT.md for this phase (no locked D-xx decisions to enforce).

COVERAGE:
- 03-01 covers R-03-01 and R-03-05 plus FR-5/6/7 test harness.
- 03-02 covers retrieval/scoring/explanations and procedure-compatible query path.
- 03-03 covers recruiter UI runtime path.
- 03-04 covers recruiter UX quality/safety and explainability presentation.
</source_audit>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create recruiter search contracts and fixtures</name>
  <files>src/types/recruiter/search.ts, tests/fixtures/recruiter/search-fixtures.ts</files>
  <action>Create zod schemas and TypeScript contracts for recruiter search request, filter model, result shape, fit score metadata (`scoreVersion`), and structured explanation atoms (`matched_skills`, `evidence`, `endorsement`, `graph_similarity`) per research guidance. Add deterministic fixtures used across integration tests.</action>
  <verify>
    <automated>npm test -- --runInBand tests/integration/graph.test.ts</automated>
  </verify>
  <done>Contracts compile and fixtures export at least one canonical "high-fit" and one "low-fit" candidate payload for downstream tests.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add integration contract tests for search, fit score, and filters</name>
  <files>tests/integration/recruiter-search.test.ts, tests/integration/recruiter-fit-explain.test.ts, tests/integration/recruiter-filters.test.ts</files>
  <behavior>
    - Test 1: Valid recruiter query returns ranked candidate array with stable ordering semantics for fixture graph data.
    - Test 2: Each candidate result includes `fitScore`, `scoreVersion`, and non-empty explanation atom array.
    - Test 3: Industry/project/skill filters remove non-matching candidates and preserve matching candidates.
  </behavior>
  <action>Write failing tests against `/api/recruiter/search` with supertest and fixture-backed setup/cleanup, mirroring existing integration test style. Keep Cypher parameterized in test setup and assert on concrete response fields (not snapshots).</action>
  <verify>
    <automated>npm test -- tests/integration/recruiter-search.test.ts tests/integration/recruiter-fit-explain.test.ts tests/integration/recruiter-filters.test.ts --runInBand</automated>
  </verify>
  <done>Tests exist, run, and fail only for not-yet-implemented recruiter endpoint logic (no schema/runtime setup failures).</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Add latency smoke test for recruiter search</name>
  <files>tests/integration/recruiter-latency.test.ts</files>
  <behavior>
    - Test 1: Representative recruiter query completes under 500ms in benchmark fixture dataset.
  </behavior>
  <action>Create a performance smoke test that measures end-to-end API response time for one deterministic query and fails when runtime exceeds 500ms (NFR-1). Keep this as smoke-level validation, not full load testing.</action>
  <verify>
    <automated>npm test -- tests/integration/recruiter-latency.test.ts --runInBand</automated>
  </verify>
  <done>Latency test is executable and wired into phase validation commands for wave and phase gates.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| recruiter client -> search API | untrusted filters and query terms cross into backend |
| test setup -> Neo4j | test-seeded data enters graph queries and must remain parameterized |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-01 | Tampering | recruiter query contract | mitigate | enforce zod schema bounds for topK, filter lists, and text lengths before any DB call |
| T-03-02 | Information Disclosure | explanation response contract | mitigate | define whitelist-only explanation atom schema; forbid raw Cypher/internal node props in contract |
| T-03-03 | Denial of Service | latency regression path | mitigate | add automated latency smoke test and cap request parameters in contract |
</threat_model>

<verification>
Run:
- `npm test -- tests/integration/recruiter-search.test.ts tests/integration/recruiter-fit-explain.test.ts tests/integration/recruiter-filters.test.ts tests/integration/recruiter-latency.test.ts --runInBand`
</verification>

<success_criteria>
- Recruiter API contracts exist in typed + validated form.
- Four recruiter integration tests are present and executable.
- FR-5/FR-6/FR-7/NFR-1 behaviors are explicitly asserted.
</success_criteria>

<output>
After completion, create `.planning/phases/03-recruiter-search-intelligent-matching/03-01-SUMMARY.md`
</output>
