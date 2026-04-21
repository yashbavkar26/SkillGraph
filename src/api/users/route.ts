import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserModel } from '../../models/user';

const router = Router();

/** Zod schema for user creation request body */
const CreateUserSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  name: z.string().min(1, 'Name is required').max(100),
});

/**
 * POST /api/users
 * Create a new user in the skill graph.
 */
router.post('/', async (req: Request, res: Response) => {
  const parse = CreateUserSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parse.error.flatten().fieldErrors,
    });
  }

  try {
    const user = await UserModel.create(parse.data);
    return res.status(201).json(user);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // Neo4j uniqueness constraint violation — email already exists
    if (message.includes('already exists') || message.includes('ConstraintValidationFailed')) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    console.error('[POST /api/users]', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/:id
 * Retrieve a user by their unique id.
 */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'User id is required' });
  }

  try {
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[GET /api/users/:id]', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
