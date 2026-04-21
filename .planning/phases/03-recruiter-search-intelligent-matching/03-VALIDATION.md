---
phase: 3
slug: recruiter-search-intelligent-matching
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-21
---

# Phase 3 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | `package.json` (`scripts.test`) |
| **Quick run command** | `npm test -- tests/integration/recruiter-search.test.ts --runInBand` |
| **Full suite command** | `npm test -- --runInBand && npm run test:integration -- --runInBand` |
| **Estimated quick runtime target** | <=30 seconds |
| **Estimated full-suite runtime** | ~180 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task-specific `<automated>` command from the active PLAN task; command should target only touched recruiter test files and stay within <=30s feedback.
- **Quick fallback (if task command is missing/inapplicable):** `npm test -- tests/integration/recruiter-search.test.ts --runInBand`
- **After every plan wave:** Run `npm test -- --runInBand && npm run test:integration -- --runInBand`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max per-task feedback latency target:** <=30 seconds
- **Max checkpoint latency (wave/phase):** ~180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | FR-5/FR-6/FR-7 | T-3-01 / - | recruiter queries are validated and sanitized before DB calls | integration | `npm test -- tests/integration/recruiter-search.test.ts --runInBand` | NO (W0) | pending |
| 3-01-02 | 01 | 0 | FR-6 | T-3-02 / - | score logic is deterministic and bounded | integration | `npm test -- tests/integration/recruiter-fit-explain.test.ts --runInBand` | NO (W0) | pending |
| 3-02-01 | 02 | 1 | FR-6/NFR-5 | T-3-03 / - | explanation payload does not leak sensitive graph internals | integration | `npm test -- tests/integration/recruiter-fit-explain.test.ts --runInBand` | NO (W0) | pending |

*Status: pending, green, red, flaky*

---

## Wave 0 Requirements

- [ ] `tests/recruiter/search.spec.ts` - stubs for search and ranking behavior
- [ ] `tests/recruiter/fit-score.spec.ts` - deterministic fit-score assertions
- [ ] `tests/integration/recruiter-search.int.spec.ts` - end-to-end search + explanation checks

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| recruiter UX readability for "Why this match" | TBD | needs product-quality human review for clarity | run UI locally, execute 5 representative searches, confirm explanations are concise and actionable |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Per-task feedback latency <=30s
- [ ] Full-suite checks run only at wave/phase checkpoints
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
