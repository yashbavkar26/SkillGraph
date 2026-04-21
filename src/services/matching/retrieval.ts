import { getDriver } from '../../db/neo4j';
import { RECRUITER_SEARCH } from '../../db/cypher/recruiterSearch';
import type { RecruiterSearchRequest } from '../../types/recruiter/search';

export type RecruiterCandidateFeatures = {
  candidateId: string;
  displayName: string;
  industries: string[];
  projectTypes: string[];
  matchedSkillIds: string[];
  matchedSkillCount: number;
  evidenceCount: number;
  endorsementCount: number;
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
  const session = getDriver().session();
  try {
    const filters = input.request.filters ?? {};
    const result = await session.run(RECRUITER_SEARCH, {
      recruiterId: input.recruiterId,
      industriesLower: normalizeLowercase(filters.industries),
      projectTypesLower: normalizeLowercase(filters.projectTypes),
      requiredSkillIds: filters.requiredSkillIds ?? [],
      topK: Math.trunc(Math.max(1, Math.min(input.request.topK, 50))),
    });

    return result.records.map((record) => ({
      candidateId: record.get('candidateId'),
      displayName: record.get('displayName'),
      industries: (record.get('industries') ?? []) as string[],
      projectTypes: (record.get('projectTypes') ?? []) as string[],
      matchedSkillIds: (record.get('matchedSkillIds') ?? []) as string[],
      matchedSkillCount: asNumber(record.get('matchedSkillCount')),
      evidenceCount: asNumber(record.get('evidenceCount')),
      endorsementCount: asNumber(record.get('endorsementCount')),
      proficiencySum: asNumber(record.get('proficiencySum')),
      graphSimilarity: asNumber(record.get('graphSimilarity')),
    }));
  } finally {
    await session.close();
  }
}

