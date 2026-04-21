import { Request, Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDriver } from '../db/neo4j';
import {
  Endorsement,
  EndorsementInputSchema,
} from '../types/endorsement';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  // T-02-03 mitigation: derive endorser identity from auth context/header.
  const endorserId = (req as any).user?.id || (req.headers['x-user-id'] as string);
  if (!endorserId) {
    return res.status(401).json({ error: 'Unauthorized: missing endorser identity' });
  }

  try {
    const input = EndorsementInputSchema.parse(req.body);
    if (input.recipientId === endorserId) {
      return res.status(400).json({ error: 'Users cannot endorse themselves' });
    }

    const driver = getDriver();
    const session = driver.session();
    try {
      const precheck = await session.run(
        `MATCH (u1:User {id: $endorserId})
         MATCH (u2:User {id: $recipientId})
         MATCH (s:Skill {id: $skillId})
         RETURN count(u1) AS endorserCount, count(u2) AS recipientCount, count(s) AS skillCount`,
        {
          endorserId,
          recipientId: input.recipientId,
          skillId: input.skillId,
        },
      );

      const counts = precheck.records[0]?.toObject() ?? {};
      const endorserCount = Number(counts.endorserCount ?? 0);
      const recipientCount = Number(counts.recipientCount ?? 0);
      const skillCount = Number(counts.skillCount ?? 0);

      if (!endorserCount || !recipientCount || !skillCount) {
        return res.status(400).json({ error: 'Endorser, recipient, or skill not found' });
      }

      const duplicateCheck = await session.run(
        `MATCH (:User {id: $endorserId})-[:ENDORSED]->(e:Endorsement)-[:FOR_SKILL]->(:Skill {id: $skillId})
         MATCH (e)-[:TO_USER]->(:User {id: $recipientId})
         RETURN e.id AS id
         LIMIT 1`,
        {
          endorserId,
          recipientId: input.recipientId,
          skillId: input.skillId,
        },
      );

      if (duplicateCheck.records.length > 0) {
        return res.status(409).json({ error: 'Duplicate endorsement for this user and skill' });
      }

      const endorsement: Endorsement = {
        id: uuidv4(),
        endorserId,
        recipientId: input.recipientId,
        skillId: input.skillId,
        timestamp: new Date().toISOString(),
        comment: input.comment,
      };

      await session.run(
        `MATCH (u1:User {id: $endorserId})
         MATCH (u2:User {id: $recipientId})
         MATCH (s:Skill {id: $skillId})
         CREATE (u1)-[:ENDORSED]->(e:Endorsement {
           id: $id,
           endorserId: $endorserId,
           recipientId: $recipientId,
           skillId: $skillId,
           timestamp: $timestamp,
           comment: $comment
         })
         CREATE (e)-[:FOR_SKILL]->(s)
         CREATE (e)-[:TO_USER]->(u2)`,
        endorsement,
      );

      return res.status(201).json(endorsement);
    } finally {
      await session.close();
    }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Failed to create endorsement', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (:User {id: $userId})<-[:TO_USER]-(e:Endorsement)-[:FOR_SKILL]->(s:Skill)
       RETURN e, s
       ORDER BY e.timestamp DESC`,
      { userId },
    );

    const endorsements = result.records.map((record) => {
      const e = record.get('e').properties;
      const s = record.get('s').properties;
      return {
        id: e.id,
        endorserId: e.endorserId,
        recipientId: e.recipientId,
        skillId: e.skillId,
        timestamp: e.timestamp,
        comment: e.comment,
        skill: {
          id: s.id,
          name: s.name,
          category: s.category,
        },
      };
    });

    return res.status(200).json(endorsements);
  } catch (error) {
    console.error('Failed to fetch endorsements', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await session.close();
  }
});

export default router;

