import request from 'supertest';
import app from '../../src/index';
import { closeDriver, getDriver } from '../../src/db/neo4j';
import { initDb } from '../../src/db/schema';
import { SCORE_VERSION } from '../../src/types/recruiter/search';
import {
  highFitCandidateFixture,
  lowFitCandidateFixture,
  recruiterSearchRequestFixture,
} from '../fixtures/recruiter/search-fixtures';

describe('Recruiter Search API Contract: Fit + Explainability', () => {
  const recruiterId = '98989898-9898-4989-8989-989898989898';

 beforeAll(async () => {
    await initDb();
    const session = getDriver().session();
    try {
      await session.run(
        `
        CREATE (:User {id: $recruiterId, email: $recruiterEmail, name: 'Recruiter Explainability Test'})
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
          highIndustries: highFitCandidateFixture.industries, // Add this
          highProjectTypes: highFitCandidateFixture.projectTypes, // Add this
          lowId: lowFitCandidateFixture.candidateId,
          lowEmail: `low-fit-${lowFitCandidateFixture.candidateId}@example.com`,
          lowName: lowFitCandidateFixture.displayName,
          lowIndustries: lowFitCandidateFixture.industries, // Add this
          lowProjectTypes: lowFitCandidateFixture.projectTypes, // Add this
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

  it('includes fitScore, scoreVersion, and structured non-empty explanations', async () => {
    const explainabilityRequest = {
      ...recruiterSearchRequestFixture,
      filters: {},
    };

    const response = await request(app)
      .post('/api/recruiter/search')
      .set('x-user-id', recruiterId)
      .send(explainabilityRequest);

    expect(response.status).toBe(200);
    expect(response.body.scoreVersion).toBe(SCORE_VERSION);
    expect(Array.isArray(response.body.candidates)).toBe(true);
    expect(response.body.candidates.length).toBeGreaterThan(0);

    for (const candidate of response.body.candidates) {
      expect(typeof candidate.fitScore).toBe('number');
      expect(candidate.scoreVersion).toBe(SCORE_VERSION);
      expect(Array.isArray(candidate.explanationAtoms)).toBe(true);
      expect(candidate.explanationAtoms.length).toBeGreaterThan(0);

      for (const atom of candidate.explanationAtoms) {
        const keys = Object.keys(atom).sort();
        expect(keys).toEqual(['contribution', 'label', 'type', 'value']);
      }
    }
  });
});
