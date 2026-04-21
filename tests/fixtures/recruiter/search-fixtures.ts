import {
  RecruiterSearchCandidateSchema,
  RecruiterSearchRequestSchema,
  RecruiterSearchResponseSchema,
  SCORE_VERSION,
  type RecruiterSearchCandidate,
  type RecruiterSearchRequest,
  type RecruiterSearchResponse,
} from '../../../src/types/recruiter/search';

export const recruiterSearchRequestFixture: RecruiterSearchRequest =
  RecruiterSearchRequestSchema.parse({
    query: 'Senior graph engineer',
    topK: 5,
    includeExplanation: true,
    filters: {
      industries: ['fintech'],
      projectTypes: ['backend-platform'],
      requiredSkillIds: [
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
      ],
      minFitScore: 0.25,
    },
  });

export const highFitCandidateFixture: RecruiterSearchCandidate =
  RecruiterSearchCandidateSchema.parse({
    candidateId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    displayName: 'High Fit Candidate',
    fitScore: 0.92,
    scoreVersion: SCORE_VERSION,
    explanationAtoms: [
      {
        type: 'matched_skills',
        label: 'Matched skills',
        value: '2 required skills matched',
        contribution: 0.45,
      },
      {
        type: 'evidence',
        label: 'Verified evidence',
        value: '3 portfolio artifacts',
        contribution: 0.22,
      },
      {
        type: 'endorsement',
        label: 'Peer endorsements',
        value: '5 endorsements in required skills',
        contribution: 0.15,
      },
      {
        type: 'graph_similarity',
        label: 'Graph similarity',
        value: '0.88 cosine similarity',
        contribution: 0.1,
      },
    ],
    matchedSkillIds: [
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
    ],
    industries: ['fintech'],
    projectTypes: ['backend-platform'],
  });

export const lowFitCandidateFixture: RecruiterSearchCandidate =
  RecruiterSearchCandidateSchema.parse({
    candidateId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    displayName: 'Low Fit Candidate',
    fitScore: 0.24,
    scoreVersion: SCORE_VERSION,
    explanationAtoms: [
      {
        type: 'matched_skills',
        label: 'Matched skills',
        value: '1 required skill matched',
        contribution: 0.12,
      },
      {
        type: 'graph_similarity',
        label: 'Graph similarity',
        value: '0.31 cosine similarity',
        contribution: 0.08,
      },
    ],
    matchedSkillIds: ['11111111-1111-4111-8111-111111111111'],
    industries: ['retail'],
    projectTypes: ['frontend-app'],
  });

export const recruiterSearchResponseFixture: RecruiterSearchResponse =
  RecruiterSearchResponseSchema.parse({
    scoreVersion: SCORE_VERSION,
    tookMs: 142,
    total: 2,
    candidates: [highFitCandidateFixture, lowFitCandidateFixture],
  });
