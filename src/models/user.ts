import { v4 as uuidv4 } from 'uuid';
import { getDriver } from '../db/neo4j';
import { User } from '../types/graph';

/**
 * Data access layer for User nodes in Neo4j.
 * All Cypher queries use parameterized inputs to prevent injection (T-02-01 mitigation).
 */
export const UserModel = {
  /**
   * Create a new User node.
   * Throws if a user with the same email already exists (uniqueness constraint).
   */
  async create(input: {
    email: string;
    name: string;
    role?: 'candidate' | 'recruiter';
  }): Promise<User> {
    const session = getDriver().session();
    try {
      const id = uuidv4();
      const createdAt = new Date().toISOString();
      const role = input.role ?? 'candidate';

      const result = await session.run(
        `CREATE (u:User {
           id: $id,
           email: $email,
           name: $name,
           role: $role,
           createdAt: $createdAt
         })
         RETURN u`,
        { id, email: input.email, name: input.name, role, createdAt }
      );

      const record = result.records[0];
      if (!record) throw new Error('User creation returned no record');

      const node = record.get('u').properties;
      return {
        id: node.id,
        email: node.email,
        name: node.name,
        role: node.role ?? 'candidate',
        createdAt: node.createdAt,
      };
    } finally {
      await session.close();
    }
  },

  /**
   * Find a User node by its surrogate id.
   * Returns null if not found.
   */
  async findById(id: string): Promise<User | null> {
    const session = getDriver().session();
    try {
      const result = await session.run(
        'MATCH (u:User {id: $id}) RETURN u',
        { id }
      );

      if (result.records.length === 0) return null;

      const node = result.records[0].get('u').properties;
      return {
        id: node.id,
        email: node.email,
        name: node.name,
        role: node.role ?? 'candidate',
        createdAt: node.createdAt,
      };
    } finally {
      await session.close();
    }
  },

  /**
   * Find a User node by email address.
   * Returns null if not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    const session = getDriver().session();
    try {
      const result = await session.run(
        'MATCH (u:User {email: $email}) RETURN u',
        { email }
      );

      if (result.records.length === 0) return null;

      const node = result.records[0].get('u').properties;
      return {
        id: node.id,
        email: node.email,
        name: node.name,
        role: node.role ?? 'candidate',
        createdAt: node.createdAt,
      };
    } finally {
      await session.close();
    }
  },

  /**
   * Search users by optional role and name/email query.
   */
  async search(input: {
    role?: 'candidate' | 'recruiter';
    query?: string;
    limit?: number;
  }): Promise<User[]> {
    const session = getDriver().session();
    try {
      const normalizedQuery = (input.query ?? '').trim().toLowerCase();
      const limit = Math.trunc(Math.max(1, Math.min(input.limit ?? 12, 50)));
      const result = await session.run(
        `MATCH (u:User)
         WHERE ($role IS NULL OR coalesce(u.role, 'candidate') = $role)
           AND (
             $query = '' OR
             toLower(coalesce(u.name, '')) CONTAINS $query OR
             toLower(coalesce(u.email, '')) CONTAINS $query
           )
         RETURN u
         ORDER BY u.createdAt DESC
         LIMIT $limit`,
        {
          role: input.role ?? null,
          query: normalizedQuery,
          limit,
        }
      );

      return result.records.map((record) => {
        const node = record.get('u').properties;
        return {
          id: node.id,
          email: node.email,
          name: node.name,
          role: node.role ?? 'candidate',
          createdAt: node.createdAt,
        };
      });
    } finally {
      await session.close();
    }
  },
};
