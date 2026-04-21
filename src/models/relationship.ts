import { v4 as uuidv4 } from 'uuid';
import { getDriver } from '../db/neo4j';
import { UserSkillRelationship } from '../types/graph';

/**
 * Data access layer for `(:User)-[:HAS_SKILL]->(:Skill)` relationships.
 * All Cypher queries are parameterized.
 */
export const RelationshipModel = {
  /**
   * Create a HAS_SKILL relationship between a User and a Skill.
   *
   * Validates both nodes exist before creating the edge.
   * Returns null if either node doesn't exist.
   * Throws on duplicate relationship (same user-skill pair).
   */
  async createUserSkill(input: {
    userId: string;
    skillId: string;
    proficiency?: 1 | 2 | 3 | 4;
  }): Promise<UserSkillRelationship | null> {
    const session = getDriver().session();
    try {
      const createdAt = new Date().toISOString();

      // Verify both nodes exist, then create the edge in one query
      const result = await session.run(
        `MATCH (u:User {id: $userId})
         MATCH (s:Skill {id: $skillId})
         MERGE (u)-[r:HAS_SKILL {userId: $userId, skillId: $skillId}]->(s)
         ON CREATE SET
           r.proficiency = $proficiency,
           r.createdAt   = $createdAt
         RETURN u, s, r,
                u.id AS userId,
                s.id AS skillId`,
        {
          userId: input.userId,
          skillId: input.skillId,
          proficiency: input.proficiency ?? null,
          createdAt,
        }
      );

      if (result.records.length === 0) {
        // One or both nodes not found — MATCH returned nothing
        return null;
      }

      const record = result.records[0];
      const rel = record.get('r').properties;

      return {
        userId: rel.userId,
        skillId: rel.skillId,
        proficiency: rel.proficiency ?? undefined,
        createdAt: rel.createdAt,
      };
    } finally {
      await session.close();
    }
  },

  /**
   * Retrieve all skills linked to a specific user.
   */
  async getSkillsForUser(userId: string): Promise<UserSkillRelationship[]> {
    const session = getDriver().session();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[r:HAS_SKILL]->(s:Skill)
         RETURN r.userId AS userId,
                r.skillId AS skillId,
                r.proficiency AS proficiency,
                r.createdAt AS createdAt`,
        { userId }
      );

      return result.records.map((record) => ({
        userId: record.get('userId'),
        skillId: record.get('skillId'),
        proficiency: record.get('proficiency') ?? undefined,
        createdAt: record.get('createdAt'),
      }));
    } finally {
      await session.close();
    }
  },
};
