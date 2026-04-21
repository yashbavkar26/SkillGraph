import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../../src/index';
import { getDriver, closeDriver } from '../../src/db/neo4j';
import { initDb } from '../../src/db/schema';

describe('assessment ingestion api', () => {
  let userId: string;
  let skillId: string;

  beforeAll(async () => {
    await initDb();
    userId = uuidv4();
    skillId = uuidv4();

    const session = getDriver().session();
    try {
      await session.run(
        `CREATE (:User {id: $userId, email: $email, name: 'Assessment User'})
         CREATE (:Skill {id: $skillId, name: 'Assessment Skill', category: 'testing'})`,
        {
          userId,
          skillId,
          email: `assessment-${userId}@example.com`,
        }
      );
    } finally {
      await session.close();
    }
  });

  afterAll(async () => {
    const session = getDriver().session();
    try {
      await session.run('MATCH (a:Assessment {userId: $userId}) DETACH DELETE a', { userId });
      await session.run('MATCH (u:User {id: $userId}) DETACH DELETE u', { userId });
      await session.run('MATCH (s:Skill {id: $skillId}) DETACH DELETE s', { skillId });
    } finally {
      await session.close();
      await closeDriver();
    }
  });

  it('accepts valid payload and links assessment nodes in graph', async () => {
    const payload = {
      userId,
      skillId,
      score: 91,
      timestamp: new Date().toISOString(),
      source: 'certification-body',
    };

    const response = await request(app)
      .post('/api/assessment/ingest')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.userId).toBe(userId);
    expect(response.body.skillId).toBe(skillId);
    expect(response.body.score).toBe(payload.score);
    expect(response.body.source).toBe(payload.source);
    expect(response.body.id).toBeTruthy();

    const session = getDriver().session();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[:HAS_ASSESSMENT]->(a:Assessment {id: $assessmentId})-[:VALIDATES]->(s:Skill {id: $skillId})
         RETURN count(a) AS linkCount, a.score AS score, a.source AS source`,
        {
          userId,
          skillId,
          assessmentId: response.body.id,
        }
      );

      expect(result.records).toHaveLength(1);
      const record = result.records[0];
      expect(Number(record.get('linkCount'))).toBe(1);
      expect(Number(record.get('score'))).toBe(payload.score);
      expect(record.get('source')).toBe(payload.source);
    } finally {
      await session.close();
    }
  });

  it('rejects malformed payload with 400', async () => {
    const response = await request(app)
      .post('/api/assessment/ingest')
      .send({
        userId,
        skillId,
        score: '91',
        timestamp: 'not-a-date',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid input');
  });

  it('returns 400 when user or skill does not exist', async () => {
    const response = await request(app)
      .post('/api/assessment/ingest')
      .send({
        userId: uuidv4(),
        skillId,
        score: 72,
        timestamp: new Date().toISOString(),
        source: 'certification-body',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('User or skill not found');
  });
});
