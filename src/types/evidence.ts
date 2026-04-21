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

export const EvidenceSchema = z.object({
  userId: z.string().uuid(),
  skillId: z.string().uuid(),
  url: z.string().url(),
  type: z.enum(['github', 'portfolio', 'certificate', 'article', 'other']),
  metadata: z.object({
    description: z.string().optional(),
    externalId: z.string().optional(),
  }).catchall(z.any()),
}).transform((data) => ({
  ...data,
  id: uuidv4(),
  createdAt: new Date().toISOString(),
}));

export type EvidenceInput = z.infer<typeof EvidenceSchema>;
