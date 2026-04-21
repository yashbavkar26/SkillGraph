import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../../src/index';
import { closeDriver, getDriver } from '../../src/db/neo4j';
import { initDb } from '../../src/db/schema';

describe('endorsement trust weighting', () => {
  const userA = uuidv4();
  const userB = uuidv4();
  const skillId = uuidv4();
  const skillName = `Neo4j ${skillId.slice(0, 8)}`;
  const normalizedSkillName = `neo4j ${skillId.slice(0, 8).toLowerCase()}`;

  beforeAll(async () => {
    await initDb();
    const session = getDriver().session();
    try {
      await session.run(
        `
        CREATE (:User {id: $userA, email: $emailA, name: 'User A', reputationScore: 0.7, createdAt: datetime() - duration({days: 200})})
        CREATE (:User {id: $userB, email: $emailB, name: 'User B', reputationScore: 0.7, createdAt: datetime() - duration({days: 200})})
        CREATE (:Skill {id: $skillId, name: $skillName, normalizedName: $normalizedSkillName})
        `,
        {
          userA,
          userB,
          skillId,
          skillName,
          normalizedSkillName,
          emailA: `a-${userA}@example.com`,
          emailB: `b-${userB}@example.com`,
        }
      );

      await session.run(
        `
        MATCH (u:User {id: $userA})
        MATCH (s:Skill {id: $skillId})
        CREATE (u)-[:HAS_SKILL {proficiency: 4, createdAt: toString(datetime())}]->(s)
        `,
        { userA, skillId }
      );
    } finally {
      await session.close();
    }
  });

  afterAll(async () => {
    const session = getDriver().session();
    try {
      await session.run('MATCH (e:Endorsement) WHERE e.skillId = $skillId DETACH DELETE e', { skillId });
      await session.run('MATCH (u:User) WHERE u.id IN $userIds DETACH DELETE u', {
        userIds: [userA, userB],
      });
      await session.run('MATCH (s:Skill {id: $skillId}) DETACH DELETE s', { skillId });
    } finally {
      await session.close();
      await closeDriver();
    }
  });

  it('downweights reciprocal endorsements structurally', async () => {
    const first = await request(app)
      .post('/api/endorse')
      .set('x-user-id', userA)
      .send({ recipientId: userB, skillId, comment: 'Great graph design' });

    expect(first.status).toBe(201);
    expect(first.body.weight).toBeGreaterThan(0);

    const reciprocal = await request(app)
      .post('/api/endorse')
      .set('x-user-id', userB)
      .send({ recipientId: userA, skillId, comment: 'Likewise' });

    expect(reciprocal.status).toBe(201);
    expect(reciprocal.body.weight).toBeLessThan(first.body.weight);
    expect(reciprocal.body.riskFlags).toContain('reciprocal-same-skill');
  });
});
