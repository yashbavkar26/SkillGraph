---
phase: 03-recruiter-search-intelligent-matching
plan: 02
type: execute
wave: 2
depends_on:
  - 03-01
files_modified:
  - src/db/cypher/recruiterSearch.ts
  - src/services/matching/retrieval.ts
  - src/services/matching/fitScore.ts
  - src/services/matching/explain.ts
  - src/services/matching/searchService.ts
  - src/api/recruiter/search.ts
  - src/index.ts
  - src/db/schema.ts
autonomous: true
requirements:
  - FR-5
  - FR-6
  - FR-7
  - NFR-1
  - NFR-5
  - TC-2
must_haves:
  truths:
    - "Recruiters can call one endpoint and get ranked candidates for a skill query."
    - "Each candidate includes deterministic fit score, score version, and explainability atoms."
    - "Contextual filters are enforced server-side."
    - "Search response stays within the phase latency target for benchmark inputs."
  artifacts:
    - path: "src/api/recruiter/search.ts"
      provides: "POST recruiter search endpoint."
    - path: "src/services/matching/searchService.ts"
      provides: "Orchestration for retrieval, scoring, and explanation."
    - path: "src/services/matching/fitScore.ts"
      provides: "Versioned deterministic fit score formula."
    - path: "src/db/cypher/recruiterSearch.ts"
      provides: "Parameterized Cypher retrieval/filter query."
  key_links:
    - from: "src/api/recruiter/search.ts"
      to: "src/services/matching/searchService.ts"
      via: "service invocation"
      pattern: "searchService"
    - from: "src/services/matching/retrieval.ts"
      to: "src/db/cypher/recruiterSearch.ts"
      via: "query execution"
      pattern: "run\\(RECRUITER_SEARCH"
    - from: "src/services/matching/searchService.ts"
      to: "src/services/matching/fitScore.ts"
      via: "score calculation"
      pattern: "computeFitScore"
---

<objective>
Implement recruiter retrieval, scoring, and explainability backend so the Phase 3 test harness passes with production-like API behavior.

Purpose: Deliver the core recruiter value path (search + fit + why) using Neo4j-compatible retrieval and deterministic scoring.
Output: `/api/recruiter/search` endpoint, matching service modules, and DB readiness/index checks.
Requirements addressed: FR-5, FR-6, FR-7, NFR-1, NFR-5, TC-2.
</objective>

<execution_context>
@C:/Users/Yash/.codex/get-shit-done/workflows/execute-plan.md
@C:/Users/Yash/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/03-recruiter-search-intelligent-matching/03-RESEARCH.md
@.planning/phases/03-recruiter-search-intelligent-matching/03-VALIDATION.md
@.planning/phases/03-recruiter-search-intelligent-matching/03-01-contracts-and-test-foundation-PLAN.md

<interfaces>
From src/db/neo4j.ts:
```typescript
export function getDriver(): Driver;
```

From src/index.ts:
```typescript
app.use('/api/users', usersRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/relationships', relationshipsRouter);
app.use('/api/evidence', evidenceRouter);
app.use('/api/endorse', endorseRouter);
```

From src/types/recruiter/search.ts (from Plan 03-01):
```typescript
export const RecruiterSearchRequestSchema: z.ZodTypeAny;
export type RecruiterSearchRequest = z.infer<typeof RecruiterSearchRequestSchema>;
export type RecruiterSearchResult = { candidateId: string; fitScore: number; scoreVersion: string; explanations: ExplanationAtom[] };
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build parameterized recruiter retrieval pipeline with Neo4j-compatible query path</name>
  <files>src/db/cypher/recruiterSearch.ts, src/services/matching/retrieval.ts, src/db/schema.ts</files>
  <action>Implement retrieval query modules using parameterized Cypher only (no string interpolation) for required-skill and contextual filters, returning raw candidate features needed for scoring. Add DB initialization checks for recruiter-search prerequisites (vector index if applicable and graceful capability check for GDS presence) aligned with current runtime constraints in research.</action>
  <verify>
    <automated>npm test -- tests/integration/recruiter-search.test.ts tests/integration/recruiter-filters.test.ts --runInBand</automated>
  </verify>
  <done>Retrieval returns candidate feature rows for valid queries and applies filters server-side without Cypher injection risk.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement deterministic fit score and explainability assembly</name>
  <files>src/services/matching/fitScore.ts, src/services/matching/explain.ts, src/services/matching/searchService.ts</files>
  <behavior>
    - Test 1: Same input feature vector always yields identical fit score and ordering.
    - Test 2: Result includes `scoreVersion` and normalized contribution values for explanation atoms.
    - Test 3: Explanations exclude internal graph metadata and only expose approved recruiter-facing fields.
  </behavior>
  <action>Implement API-tier scoring ownership per research: deterministic weighted formula with explicit `scoreVersion` and bounded numeric output. Build explanation atoms from matched skills/evidence/endorsement/similarity features and normalize contribution weights for transparent UI consumption.</action>
  <verify>
    <automated>npm test -- tests/integration/recruiter-fit-explain.test.ts --runInBand</automated>
  </verify>
  <done>Fit score output is deterministic, versioned, and explainable with structured atoms consumed by tests.</done>
</task>

<task type="auto">
  <name>Task 3: Expose recruiter endpoint and wire into server</name>
  <files>src/api/recruiter/search.ts, src/index.ts</files>
  <action>Add `POST /api/recruiter/search` route with zod validation, request-size limits, and explicit topK caps to mitigate query amplification. Wire route into Express app and map service errors to stable API responses. Ensure the phase latency smoke test command is executable and green for benchmark fixture data.</action>
  <verify>
    <automated>npm test -- tests/integration/recruiter-search.test.ts tests/integration/recruiter-fit-explain.test.ts tests/integration/recruiter-filters.test.ts tests/integration/recruiter-latency.test.ts --runInBand</automated>
  </verify>
  <done>Recruiter search endpoint is live, tested, and returns validated ranked responses with explanation payloads within latency target on smoke dataset.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| recruiter client -> API route | untrusted query text and filter payload enter backend |
| API route -> Neo4j query engine | validated params cross into Cypher execution |
| API response -> recruiter UI | explanation fields cross from internal graph domain to external consumer |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-04 | Tampering | recruiter Cypher retrieval | mitigate | use fully parameterized Cypher modules and reject unknown filter keys via zod |
| T-03-05 | Information Disclosure | explainability payload | mitigate | return whitelist-only explanation atoms and suppress internal node properties/PII |
| T-03-06 | Denial of Service | search endpoint | mitigate | enforce max topK/page size, bounded filter array lengths, and latency smoke enforcement |
| T-03-07 | Repudiation | score versioning | mitigate | include `scoreVersion` in every result for reproducible ranking semantics |
</threat_model>

<verification>
Run:
- `npm test -- tests/integration/recruiter-search.test.ts tests/integration/recruiter-fit-explain.test.ts tests/integration/recruiter-filters.test.ts tests/integration/recruiter-latency.test.ts --runInBand`
- `npm test -- --runInBand`
</verification>

<success_criteria>
- `/api/recruiter/search` provides ranked, explainable, filtered results.
- Fit score logic is deterministic and versioned.
- Integration + latency tests for Phase 3 pass.
</success_criteria>

<output>
After completion, create `.planning/phases/03-recruiter-search-intelligent-matching/03-02-SUMMARY.md`
</output>
