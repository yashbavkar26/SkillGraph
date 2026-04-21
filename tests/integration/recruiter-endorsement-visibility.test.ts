import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../../src/index';
import { closeDriver, getDriver } from '../../src/db/neo4j';
import { initDb } from '../../src/db/schema';

describe('Recruiter Search: endorsement visibility without skill graph', () => {
  const recruiterId = uuidv4();
  const endorsedOnlyCandidateId = uuidv4();
  const baselineCandidateId = uuidv4();
  const skillId = uuidv4();
  const endorsers = [uuidv4(), uuidv4(), uuidv4(), uuidv4()];

  beforeAll(async () => {
    await initDb();
    const session = getDriver().session();
    try {
      await session.run(
        `
        CREATE (:User {id: $recruiterId, email: $recruiterEmail, name: 'Recruiter'})
        CREATE (:User {
          id: $endorsedOnlyCandidateId,
          email: $endorsedOnlyEmail,
          name: 'Endorsed Only Candidate',
          industries: ['fintech'],
          projectTypes: ['backend-platform']
        })
        CREATE (:User {
          id: $baselineCandidateId,
          email: $baselineEmail,
          name: 'Baseline Candidate',
          industries: ['fintech'],
          projectTypes: ['backend-platform']
        })
        CREATE (:Skill {id: $skillId, name: 'Graph Modeling', normalizedName: 'graph modeling'})
        WITH 1 AS _
        UNWIND $endorsers AS endorserId
          CREATE (:User {id: endorserId, email: 'endorser-' + endorserId + '@example.com', name: 'Endorser'})
        `,
        {
          recruiterId,
          recruiterEmail: `recruiter-${recruiterId}@example.com`,
          endorsedOnlyCandidateId,
          endorsedOnlyEmail: `candidate-${endorsedOnlyCandidateId}@example.com`,
          baselineCandidateId,
          baselineEmail: `candidate-${baselineCandidateId}@example.com`,
          skillId,
          endorsers,
        }
      );

      await session.run(
        `
        MATCH (candidate:User {id: $baselineCandidateId})
        MATCH (skill:Skill {id: $skillId})
        CREATE (candidate)-[:HAS_SKILL {proficiency: 2, createdAt: toString(datetime())}]->(skill)
        `,
        { baselineCandidateId, skillId }
      );

      await session.run(
        `
        UNWIND $endorsers AS endorserId
        MATCH (endorser:User {id: endorserId})
        MATCH (candidate:User {id: $endorsedOnlyCandidateId})
        MATCH (skill:Skill {id: $skillId})
        CREATE (endorser)-[:ENDORSED]->(e:Endorsement {
          id: randomUUID(),
          endorserId: endorserId,
          recipientId: $endorsedOnlyCandidateId,
          skillId: $skillId,
          timestamp: toString(datetime()),
          comment: 'Strong graph work'
        })
        CREATE (e)-[:FOR_SKILL]->(skill)
        CREATE (e)-[:TO_USER]->(candidate)
        `,
        {
          endorsers,
          endorsedOnlyCandidateId,
          skillId,
        }
      );
    } finally {
      await session.close();
    }
  });

  afterAll(async () => {
    const session = getDriver().session();
    try {
      await session.run(
        `
        MATCH (u:User)
        WHERE u.id IN $userIds
        DETACH DELETE u
        `,
        {
          userIds: [recruiterId, endorsedOnlyCandidateId, baselineCandidateId, ...endorsers],
        }
      );
      await session.run('MATCH (s:Skill {id: $skillId}) DETACH DELETE s', { skillId });
    } finally {
      await session.close();
      await closeDriver();
    }
  });

  it('surfaces endorsed candidates even without HAS_SKILL links', async () => {
    const response = await request(app)
      .post('/api/recruiter/search')
      .set('x-user-id', recruiterId)
      .send({
        topK: 5,
        includeExplanation: true,
        filters: {
          requiredSkillIds: [skillId],
          industries: ['fintech'],
          projectTypes: ['backend-platform'],
        },
      });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.candidates)).toBe(true);

    const endorsedOnly = response.body.candidates.find(
      (candidate: { candidateId: string }) => candidate.candidateId === endorsedOnlyCandidateId
    );

    expect(endorsedOnly).toBeTruthy();
    expect(endorsedOnly.fitScore).toBeGreaterThan(0);

    const endorsementAtom = endorsedOnly.explanationAtoms.find(
      (atom: { type: string; value: string }) => atom.type === 'endorsement'
    );
    expect(endorsementAtom?.value).toContain('without a linked skill graph');
  });
});
