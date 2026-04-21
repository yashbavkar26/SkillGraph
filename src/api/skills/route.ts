import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { SkillModel } from '../../models/skill';

const router = Router();

/** Zod schema for skill creation request body */
const CreateSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(100),
  category: z.string().max(50).optional(),
});

/**
 * POST /api/skills
 * Create a new skill in the graph.
 */
router.post('/', async (req: Request, res: Response) => {
  const parse = CreateSkillSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parse.error.flatten().fieldErrors,
    });
  }

  try {
    const skill = await SkillModel.create(parse.data);
    return res.status(201).json(skill);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('already exists') || message.includes('ConstraintValidationFailed')) {
      return res.status(409).json({ error: 'A skill with this name already exists' });
    }
    console.error('[POST /api/skills]', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/skills/:id
 * Retrieve a skill by its unique id.
 */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Skill id is required' });
  }

  try {
    const skill = await SkillModel.findById(id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    return res.status(200).json(skill);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[GET /api/skills/:id]', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
