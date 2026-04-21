import type { RecruiterSearchExplanationAtom } from '../../types/recruiter/search';
import type { ScoredRecruiterCandidate } from './fitScore';

function normalize(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return [1, 0, 0, 0];
  }
  return values.map((value) => Number((value / total).toFixed(4)));
}

export function buildExplanationAtoms(
  candidate: ScoredRecruiterCandidate
): RecruiterSearchExplanationAtom[] {
  const normalized = normalize([
    candidate.contributions.matchedSkills,
    candidate.contributions.evidence,
    candidate.contributions.endorsement,
    candidate.contributions.graphSimilarity,
  ]);

  return [
    {
      type: 'matched_skills',
      label: 'Matched skills',
      value: `${candidate.matchedSkillCount}/${candidate.requiredSkillCount || 0} required skills matched`,
      contribution: normalized[0],
    },
    {
      type: 'evidence',
      label: 'Verified evidence',
      value: `${candidate.evidenceCount} portfolio artifacts`,
      contribution: normalized[1],
    },
    {
      type: 'endorsement',
      label: 'Peer endorsements',
      value: `${candidate.endorsementCount} endorsements in matched skills`,
      contribution: normalized[2],
    },
    {
      type: 'graph_similarity',
      label: 'Graph similarity',
      value: `${candidate.graphSimilarity.toFixed(2)} similarity score`,
      contribution: normalized[3],
    },
  ];
}

