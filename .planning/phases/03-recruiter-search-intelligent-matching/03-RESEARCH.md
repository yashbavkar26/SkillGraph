# Phase 3: Recruiter Search & Intelligent Matching - Research

**Researched:** 2026-04-21  
**Domain:** Graph-based recruiter search, similarity matching, explainable ranking  
**Confidence:** MEDIUM

## Summary

Phase 3 should be planned as a retrieval-and-ranking system on top of the existing Neo4j graph: generate embeddings (Node2Vec), retrieve candidates with vector/similarity operations, then compute a deterministic fit score and explanation payload in the API before returning results to the recruiter UI. [VERIFIED: codebase] [CITED: https://github.com/neo4j/graph-data-science/blob/2.13/doc/modules/ROOT/pages/machine-learning/node-embeddings/node2vec.adoc] [CITED: https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes]

The existing repository already has an Express + TypeScript + Neo4j backend and Jest test harness, but there is no runnable frontend build pipeline even though TSX components exist. Plan Wave 0 to establish a concrete recruiter UI runtime path (recommended: Vite + React), then implement search APIs and scoring/explanation logic. [VERIFIED: codebase] [VERIFIED: npm registry]

Neo4j vector querying has a version-sensitive path: procedure-based querying is available, while Neo4j 2026.01+ prefers the Cypher `SEARCH` clause. Because this project is pinned to `neo4j:5.18-community`, planning should use procedure-compatible queries first and keep `SEARCH` migration as an upgrade step. [VERIFIED: codebase] [CITED: https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes]

**Primary recommendation:** Use Neo4j GDS Node2Vec + vector index retrieval + API-level deterministic fit-score/explanation contract, with a small recruiter UI built on React/Vite. [CITED: https://github.com/neo4j/graph-data-science/blob/2.13/doc/modules/ROOT/pages/machine-learning/node-embeddings/node2vec.adoc] [VERIFIED: npm registry]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Node2Vec/embedding generation | Database / Storage | API / Backend | Embeddings are computed against graph structure and persisted near graph data for query efficiency. [CITED: https://github.com/neo4j/graph-data-science/blob/2.13/doc/modules/ROOT/pages/machine-learning/node-embeddings/node2vec.adoc] |
| Similarity retrieval (candidate set) | Database / Storage | API / Backend | Vector/ANN lookup belongs in indexed DB procedures, API only orchestrates query/filters. [CITED: https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes] |
| Fit score computation | API / Backend | Database / Storage | API should own final scoring formula/versioning for stable business semantics; DB returns raw features/similarity. [ASSUMED] |
| Explainability payload ("why") | API / Backend | Database / Storage | API assembles explanation text/atoms from feature contributions and graph evidence. [ASSUMED] |
| Recruiter search experience | Browser / Client | API / Backend | UI owns filters, query UX, sorting toggles; backend returns ranked explainable results. [ASSUMED] |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Neo4j Community | 5.18 (repo runtime) | Graph persistence + Cypher search | Already deployed in project (`docker-compose.yml`) and aligned with existing API model. [VERIFIED: codebase] |
| Neo4j GDS plugin | 2.13 docs line | Node2Vec, KNN graph algorithms | Official Node2Vec/KNN procedures documented and production-oriented for graph ML workflows. [CITED: https://github.com/neo4j/graph-data-science/blob/2.13/doc/modules/ROOT/pages/machine-learning/node-embeddings/node2vec.adoc] [CITED: https://github.com/neo4j/graph-data-science/blob/2.13/doc/modules/ROOT/pages/algorithms/knn.adoc] |
| neo4j-driver | 6.0.1 (modified 2026-01-22) | Node.js access to Neo4j | Official driver; supports managed transaction functions (`executeRead`/`executeWrite`). [VERIFIED: npm registry] [CITED: https://github.com/neo4j/neo4j-javascript-driver/blob/6.x/packages/neo4j-driver/README.md] |
| express | 5.2.1 (modified 2026-04-16) | Search API endpoints | Existing service pattern uses Express routing for all current APIs. [VERIFIED: npm registry] [VERIFIED: codebase] |
| zod | 4.3.6 (modified 2026-01-25) | Request validation for search filters | Existing validation pattern already uses Zod and should be extended for recruiter query contracts. [VERIFIED: npm registry] [VERIFIED: codebase] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react | 19.2.5 (modified 2026-04-17) | Recruiter-facing search UI | Use for filter controls, results list, explainability drilldown panels. [VERIFIED: npm registry] |
| react-dom | 19.2.5 (modified 2026-04-17) | Browser rendering | Required with React if UI is made runnable in browser. [VERIFIED: npm registry] |
| vite | 8.0.9 (modified 2026-04-20) | Frontend dev/build pipeline | Use because repo currently lacks any frontend bundler/runtime entrypoint. [VERIFIED: npm registry] [VERIFIED: codebase] |
| @vitejs/plugin-react | 6.0.1 (modified 2026-03-13) | JSX/TSX transform in Vite | Needed for React TSX compilation in Vite workflow. [VERIFIED: npm registry] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GDS Node2Vec embeddings | External embedding APIs (text-only) | External APIs may improve semantic text matching but add latency/cost/dependency; GDS keeps graph-topology signal local. [ASSUMED] |
| `db.index.vector.queryNodes` procedures | Cypher `SEARCH` clause | `SEARCH` is preferred in Neo4j 2026.01+, but current project runtime is 5.18; procedure path is safer now. [VERIFIED: codebase] [CITED: https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes] |
| API-owned fit scoring | Pure Cypher fit scoring | Pure Cypher can reduce app logic, but API-owned formula is easier to version/audit/explain over time. [ASSUMED] |

**Installation:**
```bash
npm install neo4j-driver express zod react react-dom
npm install -D vite @vitejs/plugin-react
```

**Version verification:** (captured on 2026-04-21)  
- `neo4j-driver@6.0.1` (time.modified 2026-01-22) [VERIFIED: npm registry]  
- `express@5.2.1` (time.modified 2026-04-16) [VERIFIED: npm registry]  
- `zod@4.3.6` (time.modified 2026-01-25) [VERIFIED: npm registry]  
- `react@19.2.5` / `react-dom@19.2.5` (time.modified 2026-04-17) [VERIFIED: npm registry]  
- `vite@8.0.9` (time.modified 2026-04-20) [VERIFIED: npm registry]  
- `@vitejs/plugin-react@6.0.1` (time.modified 2026-03-13) [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
[Recruiter UI]
   | 1) filter query + required skills + constraints
   v
[Search API: /api/recruiter/search]
   | 2) validate inputs (zod), normalize weights
   v
[Retrieval Pipeline]
   | 3a) embedding/similarity lookup (vector index or precomputed SIMILAR edges)
   | 3b) fetch candidate feature signals (skills, endorsements, evidence)
   v
[Fit Scoring Layer]
   | 4) deterministic weighted score + feature contributions
   v
[Explainability Assembler]
   | 5) "why matched" atoms (top skills, evidence count, endorsement strength)
   v
[API Response]
   | 6) ranked list + score + explanation blocks + debug metadata
   v
[Recruiter UI Results + Filters + Explanation Drawer]
```

### Recommended Project Structure
```text
src/
|-- api/recruiter/           # Recruiter search endpoints
|-- services/matching/       # Retrieval, scoring, explanation orchestration
|-- db/cypher/               # Search-specific Cypher query modules
|-- types/recruiter/         # Search request/response contracts (zod + TS)
`-- components/recruiter/    # Recruiter UI components
```

### Pattern 1: Offline Embedding + Online Retrieval
**What:** Compute/store embeddings periodically (or on update), then query nearest neighbors at request time. [CITED: https://github.com/neo4j/graph-data-science/blob/2.13/doc/modules/ROOT/pages/machine-learning/node-embeddings/node2vec.adoc]  
**When to use:** When latency target is <500ms for search requests. [VERIFIED: .planning/REQUIREMENTS.md]  
**Example:**
```cypher
// Source: https://github.com/neo4j/graph-data-science/blob/2.13/doc/modules/ROOT/pages/machine-learning/node-embeddings/node2vec.adoc
CALL gds.node2vec.write('skillGraph', {
  embeddingDimension: 64,
  nodeProperty: 'embedding'
})
YIELD nodePropertiesWritten, computeMillis;
```

### Pattern 2: Vector Index First-Stage Retrieval
**What:** Use vector index/procedure to pull top-K similar candidates before deeper scoring. [CITED: https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes]  
**When to use:** Any recruiter query with broad candidate pool. [ASSUMED]  
**Example:**
```cypher
// Source: https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes
CREATE VECTOR INDEX candidateEmbedding IF NOT EXISTS
FOR (u:User)
ON u.embedding
OPTIONS { indexConfig: {
  `vector.dimensions`: 64,
  `vector.similarity_function`: 'cosine'
}};
```

### Pattern 3: Explainability as Structured Atoms
**What:** Return explanation components (not a single opaque string), e.g., matchedSkills, evidenceCount, endorsementWeight, similarityScore. [ASSUMED]  
**When to use:** Always for FR-6 explainable fit requirements. [VERIFIED: .planning/REQUIREMENTS.md]  
**Example:**
```typescript
// Source: internal contract recommendation (phase research)
type ExplanationAtom = {
  key: 'matched_skills' | 'evidence' | 'endorsement' | 'graph_similarity';
  value: string;
  contribution: number; // normalized 0..1
};
```

### Anti-Patterns to Avoid
- **Real-time Node2Vec per request:** Causes high latency and unstable throughput; precompute embeddings instead. [CITED: https://github.com/neo4j/graph-data-science/blob/2.13/doc/modules/ROOT/pages/machine-learning/node-embeddings/node2vec.adoc]
- **Single opaque fit score with no factors:** Fails FR-6 explainability requirement and complicates debugging. [VERIFIED: .planning/REQUIREMENTS.md]
- **UI implementation before API response contract freeze:** Causes churn in recruiter components and test fixtures. [ASSUMED]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Graph embeddings | Custom random-walk trainer in app code | `gds.node2vec.*` | Mature implementation with tuning parameters and write/stream modes. [CITED: https://github.com/neo4j/graph-data-science/blob/2.13/doc/modules/ROOT/pages/machine-learning/node-embeddings/node2vec.adoc] |
| ANN/vector retrieval | Manual cosine loops in API | Neo4j vector index + query procedure | Indexed ANN retrieval is purpose-built and operationally simpler. [CITED: https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes] |
| Transaction retry logic | Homegrown retry wrappers | Neo4j managed transactions (`executeRead`/`executeWrite`) | Official driver handles transient retry patterns. [CITED: https://github.com/neo4j/neo4j-javascript-driver/blob/6.x/packages/neo4j-driver/README.md] |
| Input validation | Ad-hoc if/else validation | Zod schemas | Existing project already uses Zod; improves contract safety. [VERIFIED: codebase] |

**Key insight:** Phase 3 complexity is in ranking semantics and latency, not in building low-level graph ML primitives. [ASSUMED]

## Common Pitfalls

### Pitfall 1: GDS Assumed Available but Not Installed
**What goes wrong:** Planning assumes `gds.*` procedures exist; runtime errors occur in Neo4j. [CITED: https://neo4j.com/docs/gds]  
**Why it happens:** Current compose config enables APOC only; no explicit GDS plugin config. [VERIFIED: codebase]  
**How to avoid:** Add a Wave 0 infra verification step: `CALL gds.version()` in CI/startup check. [ASSUMED]  
**Warning signs:** `There is no procedure with the name gds...` in API logs. [ASSUMED]

### Pitfall 2: Version-Mismatch Query Syntax
**What goes wrong:** Team plans for `SEARCH` clause while running older Neo4j runtime. [CITED: https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes]  
**Why it happens:** Docs describe 2026.01 preferred path, but repo runtime is `neo4j:5.18-community`. [VERIFIED: codebase]  
**How to avoid:** Plan procedure-compatible vector queries first; gate SEARCH migration behind Neo4j upgrade task. [VERIFIED: codebase]  
**Warning signs:** Cypher parser errors around `SEARCH` keyword. [ASSUMED]

### Pitfall 3: Unstable Fit Score Across Releases
**What goes wrong:** Recruiters see unexplained ranking drift between deployments. [ASSUMED]  
**Why it happens:** Fit formula and weights are changed without versioning/baselines. [ASSUMED]  
**How to avoid:** Store score version metadata and add regression fixtures for known query/result ordering. [ASSUMED]  
**Warning signs:** Same query returns materially different top-10 after non-data code changes. [ASSUMED]

## Code Examples

Verified patterns from official sources:

### Managed Read Transaction (Neo4j JS Driver)
```typescript
// Source: https://github.com/neo4j/neo4j-javascript-driver/blob/6.x/packages/neo4j-driver/README.md
const session = driver.session({ database: 'neo4j' });
const rows = await session.executeRead(async (tx) => {
  const result = await tx.run(
    'MATCH (u:User) RETURN u.id AS id LIMIT 10'
  );
  return result.records.map((r) => r.get('id'));
});
await session.close();
```

### Vector Query Procedure
```cypher
// Source: https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes
MATCH (u:User {id: $recruiterQueryUserId})
CALL db.index.vector.queryNodes('candidateEmbedding', 25, u.embedding)
YIELD node, score
RETURN node.id AS candidateId, score
ORDER BY score DESC;
```

### Node2Vec Write Mode
```cypher
// Source: https://github.com/neo4j/graph-data-science/blob/2.13/doc/modules/ROOT/pages/machine-learning/node-embeddings/node2vec.adoc
CALL gds.node2vec.write('skillGraph', {
  embeddingDimension: 64,
  nodeProperty: 'embedding'
})
YIELD nodePropertiesWritten, computeMillis;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Procedure-first vector querying (`db.index.vector.queryNodes`) | `SEARCH` clause preferred (still procedure-compatible for legacy paths) | Neo4j 2026.01 docs | Plan must align query syntax with actual deployed Neo4j version. [CITED: https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes] |

**Deprecated/outdated:**
- Assuming vector procedure APIs are the long-term preferred query interface is outdated for Neo4j 2026.01+ docs. [CITED: https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | API tier should own final fit score formula/versioning rather than pure-Cypher ownership | Architectural Responsibility Map | Medium: could force refactor if team wants DB-owned ranking |
| A2 | Structured explanation atoms are the best API shape for FR-6 | Architecture Patterns | Medium: UI contract may change |
| A3 | External embedding APIs are less suitable than GDS-first for this phase | Standard Stack | Medium: may miss text-semantic quality gains |
| A4 | `CALL gds.version()` should be used as startup/CI guard | Common Pitfalls | Low: command may differ by environment |

## Open Questions (RESOLVED)

1. **Fit-score formula contract**
   - Resolution (2026-04-21): Phase 3 plans lock an API-owned deterministic formula with explicit `scoreVersion` and structured contribution atoms.
   - Implementation anchor: `03-02-matching-api-and-explainability-PLAN.md` Task 2 defines versioned scoring and normalized explainability output.
   - Verification anchor: `03-01-contracts-and-test-foundation-PLAN.md` Task 2 + `03-02` Task 2 require automated assertions on `fitScore`, `scoreVersion`, and explanation atoms.

2. **Neo4j upgrade scope during Phase 3**
   - Resolution (2026-04-21): Neo4j runtime upgrade is out of scope for this phase; Phase 3 uses procedure-compatible retrieval on current `neo4j:5.18-community`.
   - Implementation anchor: `03-02-matching-api-and-explainability-PLAN.md` Task 1 requires parameterized, procedure-compatible query path and graceful capability checks.
   - Future path: `SEARCH` clause migration is intentionally deferred to a dedicated runtime-upgrade phase.

3. **Frontend runtime scope**
   - Resolution (2026-04-21): Dedicated runnable recruiter UI runtime is in scope and is planned via Vite + React setup.
   - Implementation anchor: `03-03-recruiter-ui-runtime-setup-PLAN.md` establishes frontend build/runtime without breaking backend workflows.
   - Verification anchor: `03-03` and `03-04` require `npm run build` and targeted integration checks before human UX verification.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | API/UI build and tests | yes | v22.22.0 | none |
| npm | Dependency management | yes | 11.11.0 | none |
| Docker CLI | Neo4j local container workflows | yes (CLI) | 29.4.0 | Use local/remote Neo4j instance |
| Docker daemon | Running Neo4j container | no (daemon unavailable) | n/a | Use Neo4j Desktop/Aura/dev DB |
| Neo4j GDS plugin | Node2Vec/KNN procedures | no (not visible in compose config) | n/a | Temporary non-GDS similarity path or install GDS |

**Missing dependencies with no fallback:**
- None strictly blocking planning, but execution of GDS-based tasks is blocked until GDS is installed/available. [CITED: https://neo4j.com/docs/gds]

**Missing dependencies with fallback:**
- Docker daemon unavailable locally; use alternate Neo4j runtime during development. [VERIFIED: local environment]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (+ ts-jest preset) [VERIFIED: codebase] |
| Config file | `jest.config.json` [VERIFIED: codebase] |
| Quick run command | `npm test -- tests/integration/graph.test.ts --runInBand` [VERIFIED: codebase] |
| Full suite command | `npm test --runInBand` [VERIFIED: codebase] |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FR-5 | Recruiter skill-based candidate search returns ranked list | integration | `npm test -- tests/integration/recruiter-search.test.ts --runInBand` | NO (Wave 0) |
| FR-6 | API returns fit score + explanation payload | integration | `npm test -- tests/integration/recruiter-fit-explain.test.ts --runInBand` | NO (Wave 0) |
| FR-7 | Contextual filters (industry/project/skill combos) applied correctly | integration | `npm test -- tests/integration/recruiter-filters.test.ts --runInBand` | NO (Wave 0) |
| NFR-1 | Search response under 500ms for benchmark query | performance smoke | `npm test -- tests/integration/recruiter-latency.test.ts --runInBand` | NO (Wave 0) |

### Sampling Rate
- **Per task commit:** `npm test -- tests/integration/recruiter-search.test.ts --runInBand`
- **Per wave merge:** `npm test --runInBand`
- **Phase gate:** Full suite green + latency smoke under threshold for benchmark dataset

### Wave 0 Gaps
- [ ] `tests/integration/recruiter-search.test.ts` - covers FR-5
- [ ] `tests/integration/recruiter-fit-explain.test.ts` - covers FR-6
- [ ] `tests/integration/recruiter-filters.test.ts` - covers FR-7
- [ ] `tests/integration/recruiter-latency.test.ts` - covers NFR-1
- [ ] Recruiter response contract fixtures in `tests/fixtures/recruiter/` [ASSUMED]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Require authenticated recruiter identity (current project uses `x-user-id` simulation and should be hardened). [VERIFIED: codebase] |
| V3 Session Management | yes | Enforce server-side session/token strategy before production recruiter access. [ASSUMED] |
| V4 Access Control | yes | Restrict recruiter endpoints to recruiter-role principals and scoped data visibility. [ASSUMED] |
| V5 Input Validation | yes | Zod schemas for query/filter payload validation. [VERIFIED: codebase] |
| V6 Cryptography | yes | Use platform TLS and vetted secrets handling; no custom crypto. [ASSUMED] |

### Known Threat Patterns for Neo4j + Express recruiter search

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cypher injection via dynamic filters | Tampering | Parameterized Cypher only; never string-concatenate filter values. [ASSUMED] |
| Unauthorized profile discovery | Information Disclosure | Enforce recruiter authz checks and field-level response filtering. [ASSUMED] |
| Query amplification / expensive traversal DoS | Denial of Service | Hard limits on topK/page size and query timeouts. [ASSUMED] |
| Sensitive explanation leakage | Information Disclosure | Expose only approved evidence metadata in "why" responses. [ASSUMED] |

## Sources

### Primary (HIGH confidence)
- `npm registry` (`npm view`) - verified current package versions/dates for `neo4j-driver`, `express`, `zod`, `react`, `react-dom`, `vite`, `@vitejs/plugin-react`.
- https://github.com/neo4j/graph-data-science/blob/2.13/doc/modules/ROOT/pages/machine-learning/node-embeddings/node2vec.adoc - Node2Vec stream/mutate/write APIs.
- https://github.com/neo4j/graph-data-science/blob/2.13/doc/modules/ROOT/pages/algorithms/knn.adoc - KNN write/stream procedures.
- https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes - vector index creation/query and 2026.01 `SEARCH` preference.
- https://neo4j.com/docs/cypher-manual/current/indexes/syntax - vector index syntax.
- https://github.com/neo4j/neo4j-javascript-driver/blob/6.x/packages/neo4j-driver/README.md - transaction functions (`executeRead`/`executeWrite`).
- https://neo4j.com/docs/gds - GDS plugin/install guidance entry point.

### Secondary (MEDIUM confidence)
- Repository codebase inspection: `package.json`, `docker-compose.yml`, `jest.config.json`, `src/index.ts`, `src/db/neo4j.ts`, and API/component files. [VERIFIED: codebase]

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - package versions verified against npm + official Neo4j docs.
- Architecture: MEDIUM - core retrieval/scoring split partly design-driven.
- Pitfalls: MEDIUM - key infra/version pitfalls verified; some operational signs are inferred.

**Research date:** 2026-04-21  
**Valid until:** 2026-05-21

## RESEARCH COMPLETE
