import { Request, Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDriver } from '../db/neo4j';
import {
  Endorsement,
  EndorsementInputSchema,
} from '../types/endorsement';

const router = Router();

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function safeDate(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseRiskFlags(value: unknown): string[] {
  if (typeof value !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

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
         OPTIONAL MATCH (u1)-[:HAS_SKILL]->(s)
         WITH u1, u2, s, count(s) AS skillLinkCount
         OPTIONAL MATCH (u2)-[:ENDORSED]->(back:Endorsement)-[:TO_USER]->(u1)
           WHERE back.skillId = $skillId
         WITH u1, u2, skillLinkCount, count(back) AS reciprocalSameSkillCount
         OPTIONAL MATCH (u1)-[:ENDORSED]->(recentPair:Endorsement)-[:TO_USER]->(u2)
           WHERE datetime(recentPair.timestamp) >= datetime() - duration({days: 30})
         WITH u1, u2, skillLinkCount, reciprocalSameSkillCount, count(recentPair) AS pair30dCount
         OPTIONAL MATCH (u1)-[:ENDORSED]->(recentAny:Endorsement)
           WHERE datetime(recentAny.timestamp) >= datetime() - duration({days: 1})
         RETURN
           count(u1) AS endorserCount,
           count(u2) AS recipientCount,
           1 AS skillCount,
           skillLinkCount,
           reciprocalSameSkillCount,
           pair30dCount,
           count(recentAny) AS endorser24hCount,
           coalesce(toFloat(u1.reputationScore), 0.2) AS endorserReputation,
           toString(u1.createdAt) AS endorserCreatedAt`,
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
      const skillLinkCount = Number(counts.skillLinkCount ?? 0);
      const reciprocalSameSkillCount = Number(counts.reciprocalSameSkillCount ?? 0);
      const pair30dCount = Number(counts.pair30dCount ?? 0);
      const endorser24hCount = Number(counts.endorser24hCount ?? 0);
      const endorserReputation = Number(counts.endorserReputation ?? 0.2);
      const endorserCreatedAt = safeDate(counts.endorserCreatedAt);

      if (!endorserCount || !recipientCount || !skillCount) {
        return res.status(400).json({ error: 'Endorser, recipient, or skill not found' });
      }

      if (pair30dCount >= 5) {
        return res.status(429).json({
          error:
            'Too many endorsements between this pair in the last 30 days. Try again later.',
        });
      }

      if (endorser24hCount >= 40) {
        return res.status(429).json({
          error:
            'Daily endorsement rate limit reached. Please slow down and try again tomorrow.',
        });
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

      const accountAgeDays = endorserCreatedAt
        ? (Date.now() - endorserCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
        : 0;
      const accountAgeWeight = clamp(accountAgeDays / 90, 0.45, 1);
      const relationContextWeight = skillLinkCount > 0 ? 1.15 : 0.82;
      const reputationWeight = clamp(0.5 + endorserReputation * 1.4, 0.5, 1.9);
      const reciprocityPenalty = reciprocalSameSkillCount > 0 ? 0.45 : 1;
      const pairVelocityPenalty = pair30dCount >= 2 ? 0.72 : 1;
      const dailyVelocityPenalty = endorser24hCount >= 12 ? 0.75 : 1;

      const riskFlags: string[] = [];
      if (skillLinkCount === 0) {
        riskFlags.push('endorser-no-skill-context');
      }
      if (reciprocalSameSkillCount > 0) {
        riskFlags.push('reciprocal-same-skill');
      }
      if (pair30dCount >= 2) {
        riskFlags.push('dense-pair-endorsement');
      }
      if (endorser24hCount >= 12) {
        riskFlags.push('high-endorsement-velocity');
      }

      const weight = Number(
        clamp(
          relationContextWeight *
            reputationWeight *
            accountAgeWeight *
            reciprocityPenalty *
            pairVelocityPenalty *
            dailyVelocityPenalty,
          0.12,
          2.4
        ).toFixed(4)
      );

      endorsement.weight = weight;
      endorsement.riskFlags = riskFlags;

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
           comment: $comment,
           weight: $weight,
           riskFlagsJson: $riskFlagsJson
         })
         CREATE (e)-[:FOR_SKILL]->(s)
         CREATE (e)-[:TO_USER]->(u2)`,
        {
          ...endorsement,
          riskFlagsJson: JSON.stringify(riskFlags),
        },
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
        weight: Number(e.weight ?? 1),
        riskFlags: parseRiskFlags(e.riskFlagsJson),
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

