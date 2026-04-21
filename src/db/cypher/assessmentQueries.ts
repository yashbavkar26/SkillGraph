import { v4 as uuidv4 } from 'uuid';
import { getDriver } from '../neo4j';

export type LinkAssessmentInput = {
  userId: string;
  skillId: string;
  score: number;
  timestamp: string;
  source: string;
};

export type LinkedAssessment = LinkAssessmentInput & {
  id: string;
  createdAt: string;
};

const CREATE_AND_LINK_ASSESSMENT = `
MATCH (u:User {id: $userId})
MATCH (s:Skill {id: $skillId})
CREATE (a:Assessment {
  id: $id,
  userId: $userId,
  skillId: $skillId,
  score: $score,
  timestamp: $timestamp,
  source: $source,
  createdAt: $createdAt
})
CREATE (u)-[:HAS_ASSESSMENT]->(a)
CREATE (a)-[:VALIDATES]->(s)
RETURN a.id AS id
`;

export async function linkAssessment(
  input: LinkAssessmentInput
): Promise<LinkedAssessment | null> {
  const driver = getDriver();
  const session = driver.session();

  const assessment: LinkedAssessment = {
    ...input,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };

  try {
    const result = await session.run(CREATE_AND_LINK_ASSESSMENT, {
      id: assessment.id,
      userId: assessment.userId,
      skillId: assessment.skillId,
      score: assessment.score,
      timestamp: assessment.timestamp,
      source: assessment.source,
      createdAt: assessment.createdAt,
    });

    if (result.records.length === 0) {
      return null;
    }

    return assessment;
  } finally {
    await session.close();
  }
}
