import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { RelationshipModel } from '../../models/relationship';

const router = Router();

/** Zod schema for relationship creation */
const CreateRelationshipSchema = z.object({
  userId: z.string().uuid({ message: 'userId must be a valid UUID' }),
  skillId: z.string().uuid({ message: 'skillId must be a valid UUID' }),
  proficiency: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]).optional(),
});

/**
 * POST /api/relationships
 * Create a HAS_SKILL relationship between a User and a Skill.
 *
 * Returns 404 if either User or Skill does not exist.
 * Returns 200 if the relationship already exists (idempotent MERGE).
 * Returns 201 when a new relationship is created.
 */
router.post('/', async (req: Request, res: Response) => {
  const parse = CreateRelationshipSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parse.error.flatten().fieldErrors,
    });
  }

  try {
    const relationship = await RelationshipModel.createUserSkill(parse.data);

    if (!relationship) {
      return res.status(404).json({
        error: 'User or Skill not found. Both must exist before creating a relationship.',
      });
    }

    return res.status(201).json(relationship);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[POST /api/relationships]', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/relationships/users/:userId/skills
 * List all skills linked to a specific user.
 */
router.get('/users/:userId/skills', async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const relationships = await RelationshipModel.getSkillsForUser(userId);
    return res.status(200).json(relationships);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[GET /api/relationships/users/:userId/skills]', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
