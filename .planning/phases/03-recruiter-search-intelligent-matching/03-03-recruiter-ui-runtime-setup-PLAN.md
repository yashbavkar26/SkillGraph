---
phase: 03-recruiter-search-intelligent-matching
plan: 03
type: execute
wave: 3
depends_on:
  - 03-02
files_modified:
  - package.json
  - tsconfig.json
  - vite.config.ts
  - index.html
  - src/recruiter-ui/main.tsx
  - src/recruiter-ui/App.tsx
  - src/recruiter-ui/api/client.ts
autonomous: true
requirements:
  - FR-5
  - FR-6
  - FR-7
  - NFR-1
must_haves:
  truths:
    - "Recruiter UI can run locally in a real browser runtime."
    - "UI can send validated search requests to backend and receive typed responses."
    - "Frontend build pipeline is isolated from existing backend test/build workflow."
  artifacts:
    - path: "vite.config.ts"
      provides: "Frontend runtime/build configuration."
    - path: "src/recruiter-ui/main.tsx"
      provides: "Recruiter UI entrypoint."
    - path: "src/recruiter-ui/api/client.ts"
      provides: "Typed API client for recruiter search endpoint."
  key_links:
    - from: "src/recruiter-ui/api/client.ts"
      to: "/api/recruiter/search"
      via: "fetch POST request"
      pattern: "fetch\\('/api/recruiter/search'"
    - from: "package.json"
      to: "vite.config.ts"
      via: "npm scripts"
      pattern: "vite"
---

<objective>
Establish a runnable recruiter UI runtime path so recruiter search behavior can be experienced and validated in-browser rather than as component-only TSX.

Purpose: Remove frontend execution ambiguity noted in research and provide a stable base for recruiter-facing UX work.
Output: Vite + React wiring, recruiter app shell, and typed API client integration.
Requirements addressed: FR-5, FR-6, FR-7, NFR-1.
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
@.planning/phases/03-recruiter-search-intelligent-matching/03-02-matching-api-and-explainability-PLAN.md

<interfaces>
From src/types/recruiter/search.ts:
```typescript
export type RecruiterSearchRequest = { querySkills: string[]; topK?: number; filters?: Record<string, unknown> };
export type RecruiterSearchResponse = { results: RecruiterSearchResult[]; scoreVersion: string };
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add frontend runtime/build configuration without breaking backend workflows</name>
  <files>package.json, tsconfig.json, vite.config.ts, index.html</files>
  <action>Add Vite + React scripts and config in a way that preserves existing `npm test`, backend `npm run dev`, and backend `npm run build` behavior. Keep recruiter UI entrypoint scoped under `src/recruiter-ui` and ensure proxy/CORS behavior supports local calls to backend API.</action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <done>Project has explicit frontend runtime/build path and existing backend build/test commands still work.</done>
</task>

<task type="auto">
  <name>Task 2: Create recruiter app shell and typed API client wiring</name>
  <files>src/recruiter-ui/main.tsx, src/recruiter-ui/App.tsx, src/recruiter-ui/api/client.ts</files>
  <action>Implement recruiter UI bootstrapping and a typed API client that posts to `/api/recruiter/search` using contracts from Plan 03-01. Include robust loading/error states in the app shell and avoid exposing raw server errors directly to UI users.</action>
  <verify>
    <automated>npm run build && npm test -- tests/integration/recruiter-search.test.ts --runInBand</automated>
  </verify>
  <done>Recruiter UI compiles, can invoke backend search endpoint, and handles pending/success/error response states safely.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser recruiter UI -> recruiter API | user-provided search input crosses from client to backend |
| backend error payload -> UI surface | server-generated messages cross to recruiter-visible text |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-08 | Information Disclosure | UI error handling | mitigate | map backend failures to generic recruiter-safe messages and avoid rendering internal stack/DB details |
| T-03-09 | Spoofing | recruiter identity context | mitigate | pass auth context explicitly via approved mechanism and avoid client-side trust assumptions |
| T-03-10 | Denial of Service | UI request spam path | mitigate | add client-side disabled state/debounced submit guard while request is in flight |
</threat_model>

<verification>
Run:
- `npm run build`
- `npm test -- tests/integration/recruiter-search.test.ts --runInBand`
</verification>

<success_criteria>
- Recruiter UI runtime exists and builds.
- App shell can call recruiter search API through typed client.
- Backend quality gates still run successfully after frontend setup.
</success_criteria>

<output>
After completion, create `.planning/phases/03-recruiter-search-intelligent-matching/03-03-SUMMARY.md`
</output>
