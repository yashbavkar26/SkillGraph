import { z } from 'zod';

export const SCORE_VERSION = 'v1' as const;

export const ExplanationAtomTypeSchema = z.enum([
  'matched_skills',
  'evidence',
  'endorsement',
  'graph_similarity',
]);

export const RecruiterSearchExplanationAtomSchema = z.object({
  type: ExplanationAtomTypeSchema,
  label: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(240),
  contribution: z.number().min(0).max(1),
});

export type RecruiterSearchExplanationAtom = z.infer<
  typeof RecruiterSearchExplanationAtomSchema
>;

export const RecruiterSearchFilterSchema = z.object({
  industries: z.array(z.string().trim().min(1).max(64)).max(10).optional(),
  projectTypes: z.array(z.string().trim().min(1).max(64)).max(10).optional(),
  requiredSkillIds: z.array(z.string().uuid()).max(20).optional(),
  minFitScore: z.number().min(0).max(1).optional(),
});

export type RecruiterSearchFilter = z.infer<typeof RecruiterSearchFilterSchema>;

export const RecruiterSearchRequestSchema = z.object({
  query: z.string().trim().min(1).max(200).optional(),
  topK: z.number().int().min(1).max(50).default(10),
  filters: RecruiterSearchFilterSchema.default({}),
  includeExplanation: z.boolean().default(true),
});

export type RecruiterSearchRequest = z.infer<typeof RecruiterSearchRequestSchema>;

export const RecruiterSearchCandidateSchema = z.object({
  candidateId: z.string().uuid(),
  displayName: z.string().trim().min(1).max(120),
  fitScore: z.number().min(0).max(1),
  scoreVersion: z.literal(SCORE_VERSION),
  explanationAtoms: z.array(RecruiterSearchExplanationAtomSchema).min(1).max(8),
  matchedSkillIds: z.array(z.string().uuid()),
  industries: z.array(z.string().trim().min(1).max(64)).default([]),
  projectTypes: z.array(z.string().trim().min(1).max(64)).default([]),
});

export type RecruiterSearchCandidate = z.infer<typeof RecruiterSearchCandidateSchema>;

export const RecruiterSearchResponseSchema = z.object({
  scoreVersion: z.literal(SCORE_VERSION),
  tookMs: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  candidates: z.array(RecruiterSearchCandidateSchema),
});

export type RecruiterSearchResponse = z.infer<typeof RecruiterSearchResponseSchema>;
