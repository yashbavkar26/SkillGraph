import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export type EvidenceType = 'github' | 'portfolio' | 'certificate' | 'article' | 'other';

export interface EvidenceMetadata {
  description?: string;
  externalId?: string;
  [key: string]: any;
}

export interface Evidence {
  id: string;
  userId: string;
  skillId: string;
  url: string;
  type: EvidenceType;
  metadata: EvidenceMetadata;
  createdAt: string;
}

export const EvidenceInputSchema = z.object({
  skillId: z.string().uuid(),
  url: z.string().url(),
  type: z.enum(['github', 'portfolio', 'certificate', 'article', 'other']),
  metadata: z.object({
    description: z.string().optional(),
    externalId: z.string().optional(),
  }).catchall(z.any()),
});

export type EvidenceInput = z.infer<typeof EvidenceInputSchema>;

export const EvidenceSchema = EvidenceInputSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.string().datetime(),
});
