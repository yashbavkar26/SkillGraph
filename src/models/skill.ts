import { v4 as uuidv4 } from 'uuid';
import { getDriver } from '../db/neo4j';
import { Skill } from '../types/graph';

function normalizeSkillName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9+\s#.-]/g, ' ')
    .replace(/\s+/g, ' ');
}

function toDisplaySkillName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

/**
 * Data access layer for Skill nodes in Neo4j.
 * All Cypher queries use parameterized inputs (T-02-01 mitigation).
 */
export const SkillModel = {
  /**
   * Create a new Skill node.
   * Throws if a skill with the same name already exists (uniqueness constraint).
   */
  async create(input: { name: string; category?: string }): Promise<Skill> {
    const session = getDriver().session();
    try {
      const normalizedName = normalizeSkillName(input.name);
      const name = toDisplaySkillName(input.name);
      const id = uuidv4();
      const createdAt = new Date().toISOString();

      const result = await session.run(
        `CREATE (s:Skill {
           id: $id,
           name: $name,
           normalizedName: $normalizedName,
           category: $category,
           createdAt: $createdAt
         })
         RETURN s`,
        {
          id,
          name,
          normalizedName,
          category: input.category ?? null,
          createdAt,
        }
      );

      const record = result.records[0];
      if (!record) throw new Error('Skill creation returned no record');

      const node = record.get('s').properties;
      return {
        id: node.id,
        name: node.name,
        category: node.category ?? undefined,
        createdAt: node.createdAt,
      };
    } finally {
      await session.close();
    }
  },

  /**
   * Find a Skill by its surrogate id.
   * Returns null if not found.
   */
  async findById(id: string): Promise<Skill | null> {
    const session = getDriver().session();
    try {
      const result = await session.run(
        'MATCH (s:Skill {id: $id}) RETURN s',
        { id }
      );

      if (result.records.length === 0) return null;

      const node = result.records[0].get('s').properties;
      return {
        id: node.id,
        name: node.name,
        category: node.category ?? undefined,
        createdAt: node.createdAt,
      };
    } finally {
      await session.close();
    }
  },

  /**
   * Find a Skill by canonical name.
   * Returns null if not found.
   */
  async findByName(name: string): Promise<Skill | null> {
    const session = getDriver().session();
    try {
      const normalizedName = normalizeSkillName(name);
      const result = await session.run(
        `MATCH (s:Skill)
         WHERE s.normalizedName = $normalizedName OR toLower(trim(s.name)) = $normalizedName
         RETURN s
         LIMIT 1`,
        { normalizedName }
      );

      if (result.records.length === 0) return null;

      const node = result.records[0].get('s').properties;
      return {
        id: node.id,
        name: node.name,
        category: node.category ?? undefined,
        createdAt: node.createdAt,
      };
    } finally {
      await session.close();
    }
  },

  /**
   * List all skills ordered by creation time.
   */
  async list(): Promise<Skill[]> {
    const session = getDriver().session();
    try {
      const result = await session.run(
        'MATCH (s:Skill) RETURN s ORDER BY s.createdAt DESC'
      );

      return result.records.map((record) => {
        const node = record.get('s').properties;
        return {
          id: node.id,
          name: node.name,
          category: node.category ?? undefined,
          createdAt: node.createdAt,
        };
      });
    } finally {
      await session.close();
    }
  },
};
