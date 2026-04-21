import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../../src/index';
import { getDriver, closeDriver } from '../../src/db/neo4j';
import { initDb } from '../../src/db/schema';

describe('endorsement api', () => {
  let endorserId: string;
  let recipientId: string;
  let skillId: string;

  beforeAll(async () => {
    await initDb();
    endorserId = uuidv4();
    recipientId = uuidv4();
    skillId = uuidv4();

    const session = getDriver().session();
    try {
      await session.run(
        `CREATE (:User {id: $endorserId, email: $endorserEmail, name: 'Endorser'})
         CREATE (:User {id: $recipientId, email: $recipientEmail, name: 'Recipient'})
         CREATE (:Skill {id: $skillId, name: 'TypeScript', category: 'frontend'})`,
        {
          endorserId,
          recipientId,
          skillId,
          endorserEmail: `endorser-${endorserId}@example.com`,
          recipientEmail: `recipient-${recipientId}@example.com`,
        },
      );
    } finally {
      await session.close();
    }
  });

  afterAll(async () => {
    const session = getDriver().session();
    try {
      await session.run('MATCH (e:Endorsement) WHERE e.skillId = $skillId DETACH DELETE e', { skillId });
      await session.run('MATCH (u:User {id: $endorserId}) DETACH DELETE u', { endorserId });
      await session.run('MATCH (u:User {id: $recipientId}) DETACH DELETE u', { recipientId });
      await session.run('MATCH (s:Skill {id: $skillId}) DETACH DELETE s', { skillId });
    } finally {
      await session.close();
      await closeDriver();
    }
  });

  it('creates and fetches endorsements', async () => {
    const create = await request(app)
      .post('/api/endorse')
      .set('x-user-id', endorserId)
      .send({
        recipientId,
        skillId,
        comment: 'Great practical React work',
      });

    expect(create.status).toBe(201);
    expect(create.body.endorserId).toBe(endorserId);
    expect(create.body.recipientId).toBe(recipientId);
    expect(create.body.skillId).toBe(skillId);

    const list = await request(app).get(`/api/endorse/${recipientId}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBeGreaterThan(0);
    expect(list.body[0].skill.id).toBe(skillId);
  });

  it('prevents duplicate endorsements for same recipient and skill', async () => {
    const duplicate = await request(app)
      .post('/api/endorse')
      .set('x-user-id', endorserId)
      .send({
        recipientId,
        skillId,
        comment: 'Duplicate attempt',
      });

    expect(duplicate.status).toBe(409);
  });
});

