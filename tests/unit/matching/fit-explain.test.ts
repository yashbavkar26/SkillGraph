import { computeFitScore } from '../../../src/services/matching/fitScore';
import { buildExplanationAtoms } from '../../../src/services/matching/explain';
import { rankRecruiterCandidates } from '../../../src/services/matching/searchService';
import type { RecruiterCandidateFeatures } from '../../../src/services/matching/retrieval';
import { SCORE_VERSION } from '../../../src/types/recruiter/search';

function candidate(overrides: Partial<RecruiterCandidateFeatures>): RecruiterCandidateFeatures {
  return {
    candidateId: '00000000-0000-4000-8000-000000000000',
    displayName: 'Candidate',
    industries: ['fintech'],
    projectTypes: ['backend-platform'],
    matchedSkillIds: ['11111111-1111-4111-8111-111111111111'],
    matchedSkillCount: 1,
    evidenceCount: 0,
    endorsementCount: 0,
    proficiencySum: 0,
    graphSimilarity: 0.1,
    ...overrides,
  };
}

describe('matching fit score + explainability', () => {
  it('returns deterministic fit score and stable ordering for same features', () => {
    const high = candidate({
      candidateId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      displayName: 'High',
      matchedSkillIds: [
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
      ],
      matchedSkillCount: 2,
      evidenceCount: 3,
      endorsementCount: 5,
      graphSimilarity: 0.88,
      proficiencySum: 7,
    });
    const low = candidate({
      candidateId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      displayName: 'Low',
      industries: ['retail'],
      projectTypes: ['frontend-app'],
      matchedSkillCount: 1,
      endorsementCount: 1,
      evidenceCount: 1,
      graphSimilarity: 0.31,
      proficiencySum: 3,
    });

    const first = computeFitScore(high, 2);
    const second = computeFitScore(high, 2);
    expect(first.fitScore).toBe(second.fitScore);
    expect(first.scoreVersion).toBe(SCORE_VERSION);

    const ranked = rankRecruiterCandidates([low, high], {
      topK: 5,
      includeExplanation: true,
      query: 'Senior graph engineer',
      filters: {},
    });
    expect(ranked[0].candidateId).toBe(high.candidateId);
    expect(ranked[1].candidateId).toBe(low.candidateId);
  });

  it('returns versioned score with normalized explanation contributions', () => {
    const result = computeFitScore(
      candidate({
        matchedSkillCount: 2,
        matchedSkillIds: [
          '11111111-1111-4111-8111-111111111111',
          '22222222-2222-4222-8222-222222222222',
        ],
        endorsementCount: 5,
        evidenceCount: 3,
        graphSimilarity: 0.88,
        proficiencySum: 7,
      }),
      2
    );

    const atoms = buildExplanationAtoms(result);
    const totalContribution = atoms.reduce(
      (sum, atom) => sum + atom.contribution,
      0
    );

    expect(result.scoreVersion).toBe(SCORE_VERSION);
    expect(result.fitScore).toBeGreaterThanOrEqual(0);
    expect(result.fitScore).toBeLessThanOrEqual(1);
    expect(totalContribution).toBeGreaterThan(0.99);
    expect(totalContribution).toBeLessThanOrEqual(1.01);
  });

  it('keeps explanation atoms to whitelist recruiter-facing fields only', () => {
    const result = computeFitScore(candidate({}), 2);
    const atoms = buildExplanationAtoms(result);

    for (const atom of atoms) {
      expect(Object.keys(atom).sort()).toEqual([
        'contribution',
        'label',
        'type',
        'value',
      ]);
      expect([
        'matched_skills',
        'evidence',
        'endorsement',
        'graph_similarity',
      ]).toContain(atom.type);
      expect((atom as { rawNode?: unknown }).rawNode).toBeUndefined();
    }
  });
});

