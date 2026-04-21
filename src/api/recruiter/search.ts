import { Request, Response, Router } from 'express';
import { ZodError } from 'zod';
import {
  RecruiterSearchRequestSchema,
  type RecruiterSearchRequest,
} from '../../types/recruiter/search';
import { searchRecruiterCandidates } from '../../services/matching/searchService';

const router = Router();

const MAX_REQUEST_BYTES = 16 * 1024;
const TOP_K_CAP = 25;
const ALLOWED_FILTER_KEYS = new Set([
  'industries',
  'projectTypes',
  'requiredSkillIds',
  'minFitScore',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function enforceKnownFilterKeys(body: unknown): string[] {
  if (!isPlainObject(body) || !isPlainObject(body.filters)) {
    return [];
  }

  return Object.keys(body.filters).filter((key) => !ALLOWED_FILTER_KEYS.has(key));
}

router.post('/search', async (req: Request, res: Response) => {
  const recruiterId = ((req as { user?: { id?: string } }).user?.id ??
    req.headers['x-user-id']) as string | undefined;

  if (!recruiterId) {
    return res.status(401).json({ error: 'Unauthorized: missing recruiter identity' });
  }

  const requestBytes = Buffer.byteLength(JSON.stringify(req.body ?? {}), 'utf8');
  if (requestBytes > MAX_REQUEST_BYTES) {
    return res
      .status(413)
      .json({ error: `Request payload too large. Max ${MAX_REQUEST_BYTES} bytes.` });
  }

  const unknownFilterKeys = enforceKnownFilterKeys(req.body);
  if (unknownFilterKeys.length > 0) {
    return res.status(400).json({
      error: 'Invalid filter keys',
      details: unknownFilterKeys,
    });
  }

  try {
    const parsed: RecruiterSearchRequest = RecruiterSearchRequestSchema.parse(req.body);
    const constrainedRequest: RecruiterSearchRequest = {
      ...parsed,
      topK: Math.min(parsed.topK, TOP_K_CAP),
    };

    const result = await searchRecruiterCandidates({
      recruiterId,
      request: constrainedRequest,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Invalid recruiter search request',
        details: error.flatten(),
      });
    }

    console.error('[POST /api/recruiter/search] failed', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

