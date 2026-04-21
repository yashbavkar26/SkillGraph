import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserModel } from '../../models/user';

const router = Router();

/** Zod schema for user creation request body */
const CreateUserSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  name: z.string().min(1, 'Name is required').max(100),
  role: z.enum(['candidate', 'recruiter']).optional(),
});

const RegisterSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  name: z.string().min(1, 'Name is required').max(100),
  role: z.enum(['candidate', 'recruiter']),
});

const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  role: z.enum(['candidate', 'recruiter']),
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
 * POST /api/users/register
 * Explicit user registration for candidate/recruiter roles.
 */
router.post('/register', async (req: Request, res: Response) => {
  const parse = RegisterSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parse.error.flatten().fieldErrors,
    });
  }

  try {
    const { email, name, role } = parse.data;
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await UserModel.findByEmail(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const createdUser = await UserModel.create({
      email: normalizedEmail,
      name: name.trim(),
      role,
    });

    return res.status(201).json({ user: createdUser, isNewUser: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[POST /api/users/register]', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/users/login
 * Explicit login for candidate/recruiter roles.
 */
router.post('/login', async (req: Request, res: Response) => {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parse.error.flatten().fieldErrors,
    });
  }

  try {
    const email = parse.data.email.trim().toLowerCase();
    const role = parse.data.role;
    const existingUser = await UserModel.findByEmail(email);

    if (!existingUser) {
      return res.status(404).json({ error: 'Account not found. Please register first.' });
    }

    const storedRole = existingUser.role ?? 'candidate';
    if (storedRole !== role) {
      return res.status(403).json({
        error: `This email is registered as ${storedRole}. Please use ${storedRole} login.`,
      });
    }

    return res.status(200).json({ user: existingUser, isNewUser: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[POST /api/users/login]', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users
 * Search users for lightweight selection UIs.
 */
router.get('/', async (req: Request, res: Response) => {
  const query = typeof req.query.query === 'string' ? req.query.query : '';
  const roleParam = req.query.role;
  const role = roleParam === 'candidate' || roleParam === 'recruiter' ? roleParam : undefined;
  const limitParam = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;

  try {
    const users = await UserModel.search({
      query,
      role,
      limit: Number.isFinite(limitParam) ? limitParam : undefined,
    });
    return res.status(200).json(users);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[GET /api/users]', message);
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
