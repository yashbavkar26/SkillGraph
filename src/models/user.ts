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
  async create(input: { email: string; name: string }): Promise<User> {
    const session = getDriver().session();
    try {
      const id = uuidv4();
      const createdAt = new Date().toISOString();

      const result = await session.run(
        `CREATE (u:User {
           id: $id,
           email: $email,
           name: $name,
           createdAt: $createdAt
         })
         RETURN u`,
        { id, email: input.email, name: input.name, createdAt }
      );

      const record = result.records[0];
      if (!record) throw new Error('User creation returned no record');

      const node = record.get('u').properties;
      return {
        id: node.id,
        email: node.email,
        name: node.name,
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
        createdAt: node.createdAt,
      };
    } finally {
      await session.close();
    }
  },
};
