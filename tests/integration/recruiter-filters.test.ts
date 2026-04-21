import request from 'supertest';
import app from '../../src/index';
import { closeDriver, getDriver } from '../../src/db/neo4j';
import { initDb } from '../../src/db/schema';
import {
  highFitCandidateFixture,
  lowFitCandidateFixture,
  recruiterSearchRequestFixture,
} from '../fixtures/recruiter/search-fixtures';

describe('Recruiter Search API Contract: Contextual Filters', () => {
  const recruiterId = '97979797-9797-4979-8979-979797979797';

  beforeAll(async () => {
    await initDb();
    const session = getDriver().session();
    try {
      await session.run(
        `
        CREATE (:User {id: $recruiterId, email: $recruiterEmail, name: 'Recruiter Filter Test'})
        CREATE (:User {
          id: $highId,
          email: $highEmail,
          name: $highName,
          industries: $highIndustries,
          projectTypes: $highProjectTypes
        })
        CREATE (:User {
          id: $lowId,
          email: $lowEmail,
          name: $lowName,
          industries: $lowIndustries,
          projectTypes: $lowProjectTypes
        })
        `,
        {
          recruiterId,
          recruiterEmail: `recruiter-${recruiterId}@example.com`,
          highId: highFitCandidateFixture.candidateId,
          highEmail: `high-fit-${highFitCandidateFixture.candidateId}@example.com`,
          highName: highFitCandidateFixture.displayName,
          highIndustries: highFitCandidateFixture.industries,
          highProjectTypes: highFitCandidateFixture.projectTypes,
          lowId: lowFitCandidateFixture.candidateId,
          lowEmail: `low-fit-${lowFitCandidateFixture.candidateId}@example.com`,
          lowName: lowFitCandidateFixture.displayName,
          lowIndustries: lowFitCandidateFixture.industries,
          lowProjectTypes: lowFitCandidateFixture.projectTypes,
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

  it('applies industry/project/skill filters to preserve matches and remove non-matches', async () => {
    const response = await request(app)
      .post('/api/recruiter/search')
      .set('x-user-id', recruiterId)
      .send(recruiterSearchRequestFixture);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.candidates)).toBe(true);

    const candidateIds = response.body.candidates.map(
      (candidate: { candidateId: string }) => candidate.candidateId
    );

    expect(candidateIds).toContain(highFitCandidateFixture.candidateId);
    expect(candidateIds).not.toContain(lowFitCandidateFixture.candidateId);
  });
});
