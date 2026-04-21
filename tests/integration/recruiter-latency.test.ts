import request from 'supertest';
import app from '../../src/index';
import { closeDriver, getDriver } from '../../src/db/neo4j';
import { initDb } from '../../src/db/schema';
import {
  highFitCandidateFixture,
  lowFitCandidateFixture,
  recruiterSearchRequestFixture,
} from '../fixtures/recruiter/search-fixtures';

describe('Recruiter Search API Smoke: Latency', () => {
  const recruiterId = '96969696-9696-4969-8969-969696969696';

  beforeAll(async () => {
    await initDb();
    const session = getDriver().session();
    try {
      await session.run(
        `
        CREATE (:User {id: $recruiterId, email: $recruiterEmail, name: 'Recruiter Latency Test'})
        CREATE (:User {id: $highId, email: $highEmail, name: $highName})
        CREATE (:User {id: $lowId, email: $lowEmail, name: $lowName})
        `,
        {
          recruiterId,
          recruiterEmail: `recruiter-${recruiterId}@example.com`,
          highId: highFitCandidateFixture.candidateId,
          highEmail: `high-fit-${highFitCandidateFixture.candidateId}@example.com`,
          highName: highFitCandidateFixture.displayName,
          lowId: lowFitCandidateFixture.candidateId,
          lowEmail: `low-fit-${lowFitCandidateFixture.candidateId}@example.com`,
          lowName: lowFitCandidateFixture.displayName,
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
        UNWIND $userIds AS userId
        MATCH (u:User {id: userId})
        DETACH DELETE u
        `,
        {
          userIds: [
            recruiterId,
            highFitCandidateFixture.candidateId,
            lowFitCandidateFixture.candidateId,
          ],
        }
      );
    } finally {
      await session.close();
      await closeDriver();
    }
  });

  it('completes a representative recruiter query under 500ms', async () => {
    const start = Date.now();
    const response = await request(app)
      .post('/api/recruiter/search')
      .set('x-user-id', recruiterId)
      .send(recruiterSearchRequestFixture);
    const elapsedMs = Date.now() - start;

    expect(response.status).toBe(200);
    expect(elapsedMs).toBeLessThan(500);
  });
});
