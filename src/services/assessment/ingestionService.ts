import { z } from 'zod';
import {
  linkAssessment,
  type LinkedAssessment,
} from '../../db/cypher/assessmentQueries';

export const AssessmentIngestionSchema = z
  .object({
    userId: z.string().uuid(),
    skillId: z.string().uuid(),
    score: z.number().finite().min(0).max(100),
    timestamp: z.string().datetime(),
    source: z.string().trim().min(1).max(100),
  })
  .strict();

export type AssessmentIngestionInput = z.infer<typeof AssessmentIngestionSchema>;

export class AssessmentEntityNotFoundError extends Error {
  constructor() {
    super('User or skill not found');
    this.name = 'AssessmentEntityNotFoundError';
  }
}

export async function process(
  payload: unknown
): Promise<LinkedAssessment> {
  const parsed = AssessmentIngestionSchema.parse(payload);
  const assessment = await linkAssessment(parsed);

  if (!assessment) {
    throw new AssessmentEntityNotFoundError();
  }

  return assessment;
}
