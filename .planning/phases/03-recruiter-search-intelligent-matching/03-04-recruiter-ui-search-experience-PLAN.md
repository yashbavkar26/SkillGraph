---
phase: 03-recruiter-search-intelligent-matching
plan: 04
type: execute
wave: 4
depends_on:
  - 03-03
files_modified:
  - src/recruiter-ui/components/SearchForm.tsx
  - src/recruiter-ui/components/ResultsList.tsx
  - src/recruiter-ui/components/ExplanationPanel.tsx
  - src/recruiter-ui/styles/recruiter-search.css
  - src/recruiter-ui/App.tsx
autonomous: false
requirements:
  - FR-5
  - FR-6
  - FR-7
  - NFR-6
must_haves:
  truths:
    - "Recruiter can submit skill query and contextual filters from UI."
    - "Recruiter sees ranked candidates with fit score and clear explanation of why each result matched."
    - "UI handles empty, loading, error, and no-result states without ambiguity."
    - "Explanation UI avoids leaking private or internal-only details."
  artifacts:
    - path: "src/recruiter-ui/components/SearchForm.tsx"
      provides: "Skill/filter input form with guarded submission."
    - path: "src/recruiter-ui/components/ResultsList.tsx"
      provides: "Ranked candidate cards with fit score display."
    - path: "src/recruiter-ui/components/ExplanationPanel.tsx"
      provides: "Structured explanation atom rendering."
    - path: "src/recruiter-ui/styles/recruiter-search.css"
      provides: "Accessible, readable recruiter search UI styles."
  key_links:
    - from: "src/recruiter-ui/components/SearchForm.tsx"
      to: "src/recruiter-ui/api/client.ts"
      via: "submit handler"
      pattern: "onSubmit"
    - from: "src/recruiter-ui/components/ResultsList.tsx"
      to: "src/recruiter-ui/components/ExplanationPanel.tsx"
      via: "selected result detail view"
      pattern: "selectedCandidate"
---

<objective>
Deliver the recruiter-facing search experience with high-clarity explainability and explicit UI safety/quality gates.

Purpose: Complete Phase 3 user-visible value by turning backend matching signals into trustworthy recruiter decisions.
Output: Search/filter form, ranked results cards, explanation panel, and UI verification checkpoint.
Requirements addressed: FR-5, FR-6, FR-7, NFR-6.
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
@.planning/phases/03-recruiter-search-intelligent-matching/03-03-recruiter-ui-runtime-setup-PLAN.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement recruiter search form and result rendering components</name>
  <files>src/recruiter-ui/components/SearchForm.tsx, src/recruiter-ui/components/ResultsList.tsx, src/recruiter-ui/App.tsx</files>
  <action>Build recruiter form controls for required skills plus contextual filters (industry/project type/skill combos), submit to API client, and render ranked candidate results with fit score and score version. Include keyboard-accessible form controls, disabled submit while loading, and explicit empty/no-result states.</action>
  <verify>
    <automated>npm run build && npm test -- tests/integration/recruiter-filters.test.ts --runInBand</automated>
  </verify>
  <done>Recruiter can execute search and inspect ordered candidate list from browser UI with full state handling.</done>
</task>

<task type="auto">
  <name>Task 2: Implement explainability panel with safety-focused rendering</name>
  <files>src/recruiter-ui/components/ExplanationPanel.tsx, src/recruiter-ui/styles/recruiter-search.css, src/recruiter-ui/App.tsx</files>
  <action>Render structured explanation atoms with contribution labels, keep wording concise/actionable, and style UI for high readability (contrast, spacing, responsive layout). Restrict displayed fields to approved explanation contract keys and do not expose raw graph IDs, internal metadata, or personal sensitive attributes.</action>
  <verify>
    <automated>npm run build && npm test -- tests/integration/recruiter-fit-explain.test.ts --runInBand</automated>
  </verify>
  <done>Each result has a clear "why this match" view that is readable, privacy-safe, and consistent with API explanation contracts.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Human verification gate for recruiter UX quality and safety</name>
  <action>Pause after automation and collect human product judgment for explanation clarity, readability, and safe disclosure behavior before phase sign-off.</action>
  <verify>
    <automated>npm run build && npm test -- tests/integration/recruiter-fit-explain.test.ts tests/integration/recruiter-filters.test.ts --runInBand</automated>
  </verify>
  <done>Human reviewer confirms recruiter UI is clear, actionable, keyboard-usable, and free from sensitive/internal leakage in explanations.</done>
  <what-built>Recruiter search UI flow with filters, ranked results, and explainability panel</what-built>
  <how-to-verify>
    1. Run UI and backend locally (using project scripts) and open recruiter search page.
    2. Execute at least 5 representative recruiter queries, including one no-result case and one broad-result case.
    3. Confirm explanation text is concise, non-technical, and never leaks raw graph/internal identifiers.
    4. Confirm keyboard-only navigation works for search submit and result selection.
    5. Confirm loading and error states are understandable and do not expose stack traces or DB internals.
  </how-to-verify>
  <resume-signal>Type "approved" to continue, or provide issue list for fixes.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| recruiter query/filter input -> UI state -> API client | untrusted input propagates through client flow |
| backend explanation payload -> rendered recruiter UI | externally sourced text/data crosses to visible output |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-11 | Information Disclosure | explanation panel UI | mitigate | render only allowlisted explanation fields and suppress raw IDs/PII-like fields |
| T-03-12 | Tampering | client search payload | mitigate | enforce typed request model and bounded input lengths before submit |
| T-03-13 | Elevation of Privilege | recruiter UI route exposure | accept | UI itself is not auth boundary; backend authz controls remain authoritative |
</threat_model>

<verification>
Run:
- `npm run build`
- `npm test -- tests/integration/recruiter-fit-explain.test.ts tests/integration/recruiter-filters.test.ts --runInBand`
- human verify checkpoint steps above
</verification>

<success_criteria>
- Recruiter UI supports search, filter, ranking, and explainability end-to-end.
- UI quality/safety checks pass (readability, keyboard usability, no sensitive leakage).
- Human verification checkpoint is approved.
</success_criteria>

<output>
After completion, create `.planning/phases/03-recruiter-search-intelligent-matching/03-04-SUMMARY.md`
</output>
