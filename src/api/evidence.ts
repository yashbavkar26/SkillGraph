import { Router, Request, Response } from 'express';
import { getDriver } from '../db/neo4j';
import { EvidenceInputSchema, type EvidenceInput, type Evidence } from '../types/evidence';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  // T-02-02 Mitigation: Get userId from auth context (simulated via header for now)
  const userId = (req as any).user?.id || req.headers['x-user-id'] as string;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: userId missing from context' });
  }

  try {
    const validatedInput = EvidenceInputSchema.parse(req.body);
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    
    const evidence: Evidence = {
      ...validatedInput,
      id,
      userId,
      createdAt
    };

    const driver = getDriver();
    const session = driver.session();
    
    try {
      // T-02-01 Mitigation: Validate skillId existence using Cypher
      const skillCheckResult = await session.run(
        'MATCH (s:Skill {id: $skillId}) RETURN s',
        { skillId: evidence.skillId }
      );

      if (skillCheckResult.records.length === 0) {
        return res.status(400).json({ error: 'Skill not found' });
      }

      await session.run(
        `MERGE (u:User {id: $userId})
         MERGE (s:Skill {id: $skillId})
         CREATE (u)-[:HAS_EVIDENCE]->(e:Evidence {
           id: $id, 
           url: $url, 
           type: $type, 
           metadata: $metadata_json,
           createdAt: $createdAt
         })-[:DEMONSTRATES]->(s)`,
        {
          userId: evidence.userId,
          id: evidence.id,
          url: evidence.url,
          type: evidence.type,
          metadata_json: JSON.stringify(evidence.metadata),
          createdAt: evidence.createdAt,
          skillId: evidence.skillId
        }
      );

      res.status(201).json(evidence);
    } finally {
      await session.close();
    }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating evidence:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      'MATCH (u:User {id: $userId})-[:HAS_EVIDENCE]->(e:Evidence) RETURN e',
      { userId }
    );

    const evidenceList: Evidence[] = result.records.map((record) => {
      const node = record.get('e');
      let metadata = node.properties.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          metadata = {};
        }
      }

      return {
        id: node.properties.id,
        userId: node.properties.userId,
        skillId: node.properties.skillId,
        url: node.properties.url,
        type: node.properties.type,
        metadata: metadata,
        createdAt: node.properties.createdAt
      };
    });

    res.json(evidenceList);
  } catch (error) {
    console.error('Error fetching evidence:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await session.close();
  }
});

export default router;


