import {
  RecruiterSearchCandidateSchema,
  RecruiterSearchResponseSchema,
  SCORE_VERSION,
  type RecruiterSearchCandidate,
  type RecruiterSearchRequest,
  type RecruiterSearchResponse,
} from '../../types/recruiter/search';
import { buildExplanationAtoms } from './explain';
import { computeFitScore } from './fitScore';
import type { RecruiterCandidateFeatures } from './retrieval';

type SearchServiceInput = {
  recruiterId: string;
  request: RecruiterSearchRequest;
};

export function rankRecruiterCandidates(
  rows: RecruiterCandidateFeatures[],
  request: RecruiterSearchRequest
): RecruiterSearchCandidate[] {
  const requiredSkillCount = request.filters?.requiredSkillIds?.length ?? 0;
  const minFitScore = request.filters?.minFitScore ?? 0;

  const ranked = rows
    .map((row) => computeFitScore(row, requiredSkillCount))
    .filter((row) => row.fitScore >= minFitScore)
    .sort((a, b) => {
      if (b.fitScore !== a.fitScore) {
        return b.fitScore - a.fitScore;
      }
      return a.candidateId.localeCompare(b.candidateId);
    })
    .slice(0, request.topK)
    .map((row) =>
      RecruiterSearchCandidateSchema.parse({
        candidateId: row.candidateId,
        displayName: row.displayName,
        fitScore: row.fitScore,
        scoreVersion: SCORE_VERSION,
        explanationAtoms: buildExplanationAtoms(row),
        matchedSkillIds: row.matchedSkillIds,
        industries: row.industries,
        projectTypes: row.projectTypes,
      })
    );

  return ranked;
}

export async function searchRecruiterCandidates(
  input: SearchServiceInput
): Promise<RecruiterSearchResponse> {
  const startedAt = Date.now();
  const { retrieveRecruiterCandidates } = await import('./retrieval');
  const rows = await retrieveRecruiterCandidates(input);
  const candidates = rankRecruiterCandidates(rows, input.request);

  return RecruiterSearchResponseSchema.parse({
    scoreVersion: SCORE_VERSION,
    tookMs: Date.now() - startedAt,
    total: candidates.length,
    candidates,
  });
}
