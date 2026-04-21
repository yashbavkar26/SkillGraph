import { z } from 'zod';

export interface Endorsement {
  id: string;
  endorserId: string;
  recipientId: string;
  skillId: string;
  timestamp: string;
  comment?: string;
  weight?: number;
  riskFlags?: string[];
}

export const EndorsementInputSchema = z.object({
  recipientId: z.string().uuid(),
  skillId: z.string().uuid(),
  comment: z.string().trim().max(500).optional(),
});

export type EndorsementInput = z.infer<typeof EndorsementInputSchema>;

export const EndorsementSchema = EndorsementInputSchema.extend({
  id: z.string().uuid(),
  endorserId: z.string().uuid(),
  timestamp: z.string().datetime(),
});

