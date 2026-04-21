# Roadmap: SkillGraph

## Phase 1: Foundation (Core Graph & Identity) ✅ Complete (2026-04-21)
*Goal: Establish the basic graph structure and user identity.*
- [x] Define core graph schema (User, Skill, Relationship).
- [x] Implement Graph Database (e.g., Neo4j) setup.
- [x] Develop basic API for User and Skill management.
- [x] Implement basic User Profile creation.

**Plans:** 3 plans ✅ all complete
- [x] 01-01-PLAN.md ✅ Infrastructure & Schema
- [x] 02-02-PLAN.md ✅ Core Entity APIs
- [x] 03-03-PLAN.md ✅ Relationship & Integration

## Phase 2: Evidence & Peer Endorsement
*Goal: Enable users to build their profile with verifiable data.*
- [ ] Implement Evidence Linking (external URL/artifact support).
- [ ] Implement basic Peer Endorsement system.
- [ ] Develop basic Reputation Engine (simple weighting).
- [ ] Build basic Talent Portal UI for skill management.

**Plans:** 3 plans
- [x] 02-01-PLAN.md — Evidence & Artifact Integration
- [x] 02-02-PLAN.md — Peer Endorsement System
- [x] 02-03-PLAN.md — Talent Portal UI

## Phase 3: Recruiter Search & Intelligent Matching
*Goal: Deliver value to recruiters through advanced search capabilities.*
- [ ] Implement Similarity-Search algorithms (Node2Vec/Embeddings).
- [ ] Develop 'Fit Score' calculation logic.
- [ ] Implement Explainable Search results (the "Why").
- [ ] Build Recruiter Search Engine UI.

**Plans:** 4 plans
- [x] 03-01-contracts-and-test-foundation-PLAN.md — Define contracts and Wave-0 recruiter validation tests
- [x] 03-02-matching-api-and-explainability-PLAN.md — Implement retrieval, fit scoring, and explainable recruiter API
- [ ] 03-03-recruiter-ui-runtime-setup-PLAN.md — Establish runnable recruiter frontend runtime and API client wiring
- [ ] 03-04-recruiter-ui-search-experience-PLAN.md — Deliver recruiter search UX with explainability and UI quality gate

## Phase 4: Advanced Verification & Scaling
*Goal: Strengthen trust and prepare for mass adoption.*
- [ ] Implement Advanced Reputation Engine (EigenTrust/Contextual weighting).
- [ ] Integrate Automated Assessment ingestion.
- [ ] Implement Anomaly Detection for endorsement collusion.
- [ ] Optimize graph queries and scaling for high concurrency.
