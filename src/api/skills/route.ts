import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { SkillModel } from '../../models/skill';
import { getDriver } from '../../db/neo4j';

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
    const existingSkill = await SkillModel.findByName(parse.data.name);
    if (existingSkill) {
      return res.status(200).json(existingSkill);
    }

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
 * GET /api/skills
 * List all skills to support dashboard rendering.
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const skills = await SkillModel.list();
    return res.status(200).json(skills);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[GET /api/skills]', message);
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

/**
 * GET /api/skills/:id/history
 * Basic timeline combining relationship/evidence/endorsement events for the skill.
 */
router.get('/:id/history', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Skill id is required' });
  }

  const session = getDriver().session();
  try {
    const result = await session.run(
      `MATCH (s:Skill {id: $skillId})
       OPTIONAL MATCH (u:User)-[r:HAS_SKILL]->(s)
       OPTIONAL MATCH (u)-[:HAS_EVIDENCE]->(ev:Evidence)-[:DEMONSTRATES]->(s)
       OPTIONAL MATCH (:User)-[:ENDORSED]->(en:Endorsement)-[:FOR_SKILL]->(s)
       WITH s, collect(DISTINCT r) AS rels, collect(DISTINCT ev) AS evidence, collect(DISTINCT en) AS endorsements
       RETURN s.id AS skillId, rels, evidence, endorsements`,
      { skillId: id },
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const record = result.records[0];
    const history = [];

    const rels = record.get('rels') ?? [];
    for (const rel of rels) {
      if (!rel) continue;
      const p = rel.properties ?? {};
      history.push({
        id: `rel-${p.createdAt ?? Math.random().toString(16)}`,
        type: 'level_change',
        detail: `Skill linked with proficiency ${p.proficiency ?? 'unknown'}`,
        timestamp: p.createdAt ?? new Date().toISOString(),
      });
    }

    const evidence = record.get('evidence') ?? [];
    for (const ev of evidence) {
      if (!ev) continue;
      const p = ev.properties ?? {};
      history.push({
        id: `ev-${p.id ?? Math.random().toString(16)}`,
        type: 'evidence_added',
        detail: p.url ? `Evidence added: ${p.url}` : 'Evidence added',
        timestamp: p.createdAt ?? new Date().toISOString(),
      });
    }

    const endorsements = record.get('endorsements') ?? [];
    for (const en of endorsements) {
      if (!en) continue;
      const p = en.properties ?? {};
      history.push({
        id: `en-${p.id ?? Math.random().toString(16)}`,
        type: 'endorsement_added',
        detail: p.comment ? `Endorsed: ${p.comment}` : 'Endorsement added',
        timestamp: p.timestamp ?? new Date().toISOString(),
      });
    }

    history.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return res.status(200).json(history);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[GET /api/skills/:id/history]', message);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await session.close();
  }
});

export default router;
