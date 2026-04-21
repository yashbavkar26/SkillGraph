import type { Driver } from 'neo4j-driver';

export const PERFORMANCE_INDEX_STATEMENTS: readonly string[] = [
  'CREATE INDEX user_id_idx IF NOT EXISTS FOR (u:User) ON (u.id)',
  'CREATE INDEX user_industries_idx IF NOT EXISTS FOR (u:User) ON (u.industries)',
  'CREATE INDEX user_project_types_idx IF NOT EXISTS FOR (u:User) ON (u.projectTypes)',
  'CREATE INDEX skill_id_idx IF NOT EXISTS FOR (s:Skill) ON (s.id)',
  'CREATE INDEX endorsement_confidence_idx IF NOT EXISTS FOR ()-[e:ENDORSED]-() ON (e.confidence)',
];

export type ApplyIndexesResult = {
  appliedStatements: number;
};

/**
 * Applies read-path indexes needed for high-frequency recruiter and reputation traversals.
 */
export async function applyIndexes(driver: Driver): Promise<ApplyIndexesResult> {
  const session = driver.session();
  try {
    for (const statement of PERFORMANCE_INDEX_STATEMENTS) {
      await session.run(statement);
    }

    return {
      appliedStatements: PERFORMANCE_INDEX_STATEMENTS.length,
    };
  } finally {
    await session.close();
  }
}
