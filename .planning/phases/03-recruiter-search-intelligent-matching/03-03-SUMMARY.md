---
phase: 03-recruiter-search-intelligent-matching
plan: 03
subsystem: recruiter-ui-runtime
tags: [vite, react, recruiter-search, typed-client]
requires:
  - phase: 03-02
    provides: recruiter search API, score contract, explanation atom schema
provides:
  - Separate recruiter UI runtime and production build pipeline
  - Typed recruiter search client with recruiter-safe error mapping
  - Recruiter app shell bootstrapped under src/recruiter-ui
affects: [phase-03-04, recruiter-ui]
tech-stack:
  added: [react, react-dom, vite, @vitejs/plugin-react]
  patterns: [shared-zod-contracts, split-tsconfig-builds, proxy-backed-local-ui]
key-files:
  created:
    - index.html
    - vite.config.ts
    - tsconfig.server.json
    - tsconfig.frontend.json
    - src/recruiter-ui/main.tsx
    - src/recruiter-ui/App.tsx
    - src/recruiter-ui/api/client.ts
  modified:
    - package.json
    - tsconfig.json
key-decisions:
  - "Kept backend dev flow on ts-node-dev and added a separate Vite pipeline for the recruiter UI."
  - "Shared recruiter request/response schemas directly with the frontend client to avoid contract drift."
  - "Mapped API failures to recruiter-safe messages instead of rendering raw server responses."
requirements-completed: [FR-5, FR-6, FR-7, NFR-1]
completed: 2026-04-21
---

# Phase 3 Plan 3: Recruiter UI Runtime Setup Summary

Implemented a dedicated recruiter frontend runtime without breaking the existing Express backend workflow. The project now builds the backend with `tsc -p tsconfig.server.json` and the recruiter UI with Vite into `dist/recruiter-ui`.

## Accomplishments
- Added a standalone recruiter UI entrypoint at `src/recruiter-ui/main.tsx` and bootstrapped the app shell in `src/recruiter-ui/App.tsx`.
- Added `src/recruiter-ui/api/client.ts` to validate shared recruiter search contracts and convert server failures into safe recruiter-facing messages.
- Split TypeScript config for server and frontend builds so the backend stays stable while TSX compiles in the UI pipeline.

## Verification Results
- `npm run build` -> PASS
- `npm test -- tests/integration/recruiter-search.test.ts --runInBand` -> PASS (with local Neo4j runtime)

## Notes
- Dependencies were installed locally and `package-lock.json` updated as part of the runtime setup.
- Vite emits a deprecation notice about its CJS Node API during build, but the build succeeds.
