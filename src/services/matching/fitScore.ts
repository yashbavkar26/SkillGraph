import { SCORE_VERSION } from '../../types/recruiter/search';
import type { RecruiterCandidateFeatures } from './retrieval';

const FIT_SCORE_WEIGHTS = {
  matchedSkills: 0.4,
  evidence: 0.15,
  endorsement: 0.15,
  graphSimilarity: 0.3,
} as const;

type FitScoreContributions = {
  matchedSkills: number;
  evidence: number;
  endorsement: number;
  graphSimilarity: number;
};

export type ScoredRecruiterCandidate = RecruiterCandidateFeatures & {
  fitScore: number;
  scoreVersion: typeof SCORE_VERSION;
  requiredSkillCount: number;
  contributions: FitScoreContributions;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round4(value: number): number {
  return Number(value.toFixed(4));
}

export function computeFitScore(
  candidate: RecruiterCandidateFeatures,
  requiredSkillCount: number
): ScoredRecruiterCandidate {
  const matchedSkillsRatio =
    requiredSkillCount > 0
      ? clamp01(candidate.matchedSkillCount / requiredSkillCount)
      : clamp01(candidate.matchedSkillCount > 0 ? 1 : 0);
  const evidenceRatio = clamp01(candidate.evidenceCount / 5);
  const endorsementRatio = clamp01(candidate.endorsementCount / 5);
  const similarityRatio = clamp01(candidate.graphSimilarity);

  const contributions: FitScoreContributions = {
    matchedSkills: round4(FIT_SCORE_WEIGHTS.matchedSkills * matchedSkillsRatio),
    evidence: round4(FIT_SCORE_WEIGHTS.evidence * evidenceRatio),
    endorsement: round4(FIT_SCORE_WEIGHTS.endorsement * endorsementRatio),
    graphSimilarity: round4(FIT_SCORE_WEIGHTS.graphSimilarity * similarityRatio),
  };

  const fitScore = round4(
    clamp01(
      contributions.matchedSkills +
        contributions.evidence +
        contributions.endorsement +
        contributions.graphSimilarity
    )
  );

  return {
    ...candidate,
    fitScore,
    scoreVersion: SCORE_VERSION,
    requiredSkillCount,
    contributions,
  };
}
