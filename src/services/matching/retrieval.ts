import { RECRUITER_SEARCH } from '../../db/cypher/recruiterSearch';
import {
  QueryOverloadError,
  performanceQueryOptimizer,
} from '../performance/queryOptimizer';
import type { RecruiterSearchRequest } from '../../types/recruiter/search';

export type RecruiterCandidateFeatures = {
  candidateId: string;
  displayName: string;
  industries: string[];
  projectTypes: string[];
  matchedSkillIds: string[];
  matchedSkillCount: number;
  matchedEndorsedSkillCount: number;
  candidateSkillCount: number;
  evidenceCount: number;
  endorsementCount: number;
  weightedEndorsementScore: number;
  uniqueEndorserCount: number;
  proficiencySum: number;
  graphSimilarity: number;
};

type RetrievalInput = {
  recruiterId: string;
  request: RecruiterSearchRequest;
};

function normalizeLowercase(values: string[] | undefined): string[] {
  if (!values || values.length === 0) {
    return [];
  }
  return values.map((value) => value.trim().toLowerCase());
}

function asNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as { toNumber: unknown }).toNumber === 'function'
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value ?? 0);
}

export async function retrieveRecruiterCandidates(
  input: RetrievalInput
): Promise<RecruiterCandidateFeatures[]> {
  const filters = input.request.filters ?? {};
  const queryParams = {
    recruiterId: input.recruiterId,
    industriesLower: normalizeLowercase(filters.industries),
    projectTypesLower: normalizeLowercase(filters.projectTypes),
    requiredSkillIds: filters.requiredSkillIds ?? [],
    candidatePoolSize: Math.trunc(Math.max(input.request.topK * 4, 40)),
  };

  try {
    return await performanceQueryOptimizer.executeCachedRead({
      queryType: 'similarity',
      cypher: RECRUITER_SEARCH,
      params: queryParams,
      mapResult: (records) =>
        records.map((record) => ({
          candidateId: record.get('candidateId'),
          displayName: record.get('displayName'),
          industries: (record.get('industries') ?? []) as string[],
          projectTypes: (record.get('projectTypes') ?? []) as string[],
          matchedSkillIds: (record.get('matchedSkillIds') ?? []) as string[],
          matchedSkillCount: asNumber(record.get('matchedSkillCount')),
          matchedEndorsedSkillCount: asNumber(record.get('matchedEndorsedSkillCount')),
          candidateSkillCount: asNumber(record.get('candidateSkillCount')),
          evidenceCount: asNumber(record.get('evidenceCount')),
          endorsementCount: asNumber(record.get('endorsementCount')),
          weightedEndorsementScore: asNumber(record.get('weightedEndorsementScore')),
          uniqueEndorserCount: asNumber(record.get('uniqueEndorserCount')),
          proficiencySum: asNumber(record.get('proficiencySum')),
          graphSimilarity: asNumber(record.get('graphSimilarity')),
        })),
      cacheTtlMs: 30_000,
    });
  } catch (error) {
    if (error instanceof QueryOverloadError || (error as Error).name === 'QueryOverloadError') {
      return [];
    }
    throw error;
  }
}

