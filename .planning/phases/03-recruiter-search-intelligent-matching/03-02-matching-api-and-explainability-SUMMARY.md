---
phase: 03-recruiter-search-intelligent-matching
plan: 02
subsystem: api
tags: [neo4j, express, zod, recruiter-search, explainability, scoring]
requires:
  - phase: 03-01
    provides: recruiter search contracts, fixtures, and integration harness
provides:
  - Parameterized recruiter retrieval query and feature extraction service
  - Deterministic fit scoring with scoreVersion and explainability atoms
  - POST /api/recruiter/search endpoint with validation, filter-key checks, and request bounds
affects: [recruiter-ui, phase-03-03, phase-03-04]
tech-stack:
  added: []
  patterns: [parameterized-cypher, api-owned-scoring, whitelist-explanations]
key-files:
  created:
    - src/db/cypher/recruiterSearch.ts
    - src/services/matching/retrieval.ts
    - src/services/matching/fitScore.ts
    - src/services/matching/explain.ts
    - src/services/matching/searchService.ts
    - src/api/recruiter/search.ts
    - tests/unit/matching/fit-explain.test.ts
  modified:
    - src/db/schema.ts
    - src/index.ts
    - tests/integration/recruiter-search.test.ts
key-decisions:
  - "Kept retrieval fully parameterized and moved ranking/explainability ownership to API service modules."
  - "Added startup capability checks for GDS/vector index and continued with safe fallback when unavailable."
  - "Enforced whitelist-only explainability atoms and strict recruiter filter key validation at the API boundary."
patterns-established:
  - "Matching pattern: retrieve raw graph features -> compute deterministic score -> assemble normalized explanation atoms."
  - "Security pattern: zod validation + request-size/topK guardrails + parameterized Cypher."
requirements-completed: [FR-5, FR-6, FR-7, NFR-1, NFR-5, TC-2]
duration: 45min
completed: 2026-04-21
---

# Phase 3 Plan 2: Matching API and Explainability Summary

**Recruiter matching backend now exposes one ranked search API with deterministic score versioning and structured explainability atoms built from parameterized Neo4j retrieval features.**

## Performance

- **Duration:** 45 min
- **Started:** 2026-04-21T10:54:36Z
- **Completed:** 2026-04-21T11:39:36Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Implemented recruiter retrieval Cypher and retrieval service with server-side contextual filtering and no Cypher string interpolation.
- Implemented deterministic fit score calculation (`scoreVersion: v1`) plus normalized recruiter-facing explanation atoms.
- Added `POST /api/recruiter/search` endpoint and wired it into the server with validation, payload-size limit, `topK` cap, and stable error handling.

## Task Commits

1. **Task 1: Build parameterized recruiter retrieval pipeline with Neo4j-compatible query path** - `bd8a122` (feat)
2. **Task 2: Implement deterministic fit score and explainability assembly (TDD RED)** - `5d9495f` (test)
3. **Task 2: Implement deterministic fit score and explainability assembly (TDD GREEN)** - `2948ea5` (feat)
4. **Task 3: Expose recruiter endpoint and wire into server** - `7ea3ca5` (feat)

## Files Created/Modified
- `src/db/cypher/recruiterSearch.ts` - Parameterized recruiter search retrieval query.
- `src/services/matching/retrieval.ts` - Retrieval execution and typed feature mapping.
- `src/services/matching/fitScore.ts` - Deterministic weighted scoring with versioning.
- `src/services/matching/explain.ts` - Explainability atom construction with normalized contributions.
- `src/services/matching/searchService.ts` - Retrieval/scoring/explanation orchestration and ranking.
- `src/api/recruiter/search.ts` - API route with request guards and service integration.
- `src/db/schema.ts` - Startup readiness checks for GDS/vector capabilities.
- `src/index.ts` - Router wiring for `/api/recruiter/search`.
- `tests/unit/matching/fit-explain.test.ts` - RED/GREEN TDD coverage for scoring and explainability behavior.
- `tests/integration/recruiter-search.test.ts` - Fixed ranking test payload conflict by sending unfiltered request for ranking-only assertion.

## Decisions Made
- Used API-owned deterministic fit scoring and explicit score versioning (`v1`) to satisfy reproducibility and repudiation requirements.
- Kept explanation payload restricted to approved recruiter atom fields (`type`, `label`, `value`, `contribution`), excluding internal graph metadata.
- Added explicit unknown filter-key rejection in route-level validation to close tampering vector from untrusted payload keys.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Resolved ranking-vs-filter fixture conflict in integration contract**
- **Found during:** Task 3
- **Issue:** Ranking integration test reused a filtered fixture, conflicting with its own expectation of returning both high-fit and low-fit candidates.
- **Fix:** Updated ranking test request to use unfiltered payload for ranking assertions while keeping filter behavior validated in the dedicated filter test.
- **Files modified:** `tests/integration/recruiter-search.test.ts`
- **Verification:** Unit matching test suite passes; integration suite currently blocked by missing Neo4j runtime in this environment.
- **Committed in:** `7ea3ca5`

---

**Total deviations:** 1 auto-fixed (Rule 1)
**Impact on plan:** Kept scope aligned and removed contradictory contract behavior.

## Issues Encountered
- Neo4j runtime was unavailable in the execution environment, so all integration tests that require DB connectivity failed at connection setup.

## User Setup Required

None - no additional external service setup was added by this plan. Existing Neo4j runtime is still required to run integration tests.

## Next Phase Readiness
- Recruiter search API contract is implemented and wired for UI integration in 03-03/03-04.
- Must run Phase 3 integration tests in an environment with a reachable Neo4j instance before final functional sign-off.

## Verification Results

- `npm test -- tests/unit/matching/fit-explain.test.ts --runInBand` -> **PASS** (3/3 tests)
- `npm test -- tests/integration/recruiter-search.test.ts tests/integration/recruiter-fit-explain.test.ts tests/integration/recruiter-filters.test.ts tests/integration/recruiter-latency.test.ts --runInBand` -> **FAIL** (Neo4j connection unavailable)
- `npm test -- --runInBand` -> **FAIL** (integration suites require Neo4j; unit suite passes)

## Self-Check: PASSED

- Summary file exists.
- All task commit hashes referenced in this summary exist in git history.
