import { Request, Response, Router } from 'express';
import {
  AssessmentEntityNotFoundError,
  process,
} from '../../services/assessment/ingestionService';

const router = Router();

router.post('/ingest', async (req: Request, res: Response) => {
  try {
    const assessment = await process(req.body);
    return res.status(201).json(assessment);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return res.status(400).json({
        error: 'Invalid input',
        details: error.errors,
      });
    }

    if (error instanceof AssessmentEntityNotFoundError) {
      return res.status(400).json({ error: error.message });
    }

    console.error('Failed to ingest assessment', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
