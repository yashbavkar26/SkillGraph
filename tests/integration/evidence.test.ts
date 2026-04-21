import request from 'supertest';
import app from '../../src/index';
import { getDriver, closeDriver } from '../../src/db/neo4j';
import { initDb } from '../../src/db/schema';
import { v4 as uuidv4 } from 'uuid';

describe('Evidence API Integration', () => {
  let userId: string;
  let skillId: string;

  beforeAll(async () => {
    await initDb();
    // Setup test data
    userId = uuidv4();
    skillId = uuidv4();
    
    const driver = getDriver();
    const session = driver.session();
    try {
      await session.run(
        'CREATE (:User {id: $userId, email: $email})',
        { userId, email: `test-${userId}@example.com` }
      );
      await session.run(
        'CREATE (:Skill {id: $skillId, name: $name})',
        { skillId, name: 'Test Skill' }
      );
    } finally {
      await session.close();
    }
  });

  afterAll(async () => {
    const driver = getDriver();
    const session = driver.session();
    try {
      // Cleanup
      await session.run('MATCH (u:User {id: $userId}) DETACH DELETE u', { userId });
      await session.run('MATCH (s:Skill {id: $skillId}) DETACH DELETE s', { skillId });
    } finally {
      await session.close();
      await closeDriver();
    }
  });

  it('should create new evidence and retrieve it', async () => {
    const evidencePayload = {
      skillId: skillId,
      url: 'https://github.com/test/repo',
      type: 'github',
      metadata: { description: 'Test evidence' }
    };

    // POST evidence
    const postResponse = await request(app)
      .post('/api/evidence')
      .set('x-user-id', userId)
      .send(evidencePayload);

    expect(postResponse.status).toBe(201);
    const createdEvidence = postResponse.body;
    expect(createdEvidence.url).toBe(evidencePayload.url);
    expect(createdEvidence.userId).toBe(userId);
    expect(createdEvidence.skillId).toBe(skillId);

    // GET evidence
    const getResponse = await request(app)
      .get(`/api/evidence/${userId}`);

    expect(getResponse.status).toBe(200);
    expect(Array.isArray(getResponse.body)).toBe(true);
    expect(getResponse.body.some((e: any) => e.id === createdEvidence.id)).toBe(true);
  });

  it('should return 401 if userId is missing', async () => {
    const postResponse = await request(app)
      .post('/api/evidence')
      .send({
        skillId: skillId,
        url: 'https://github.com/test/repo',
        type: 'github',
        metadata: {}
      });

    expect(postResponse.status).toBe(401);
  });

  it('should return 400 if skillId does not exist', async () => {
    const nonExistentSkillId = uuidv4();
    const postResponse = await request(app)
      .post('/api/evidence')
      .set('x-user-id', userId)
      .send({
        skillId: nonExistentSkillId,
        url: 'https://github.com/test/repo',
        type: 'github',
        metadata: {}
      });

    expect(postResponse.status).toBe(400);
    expect(postResponse.body.error).toBe('Skill not found');
  });
});
