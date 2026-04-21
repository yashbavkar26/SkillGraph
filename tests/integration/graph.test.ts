import 'dotenv/config';
import { initDb } from '../../src/db/schema';
import { closeDriver, getDriver } from '../../src/db/neo4j';
import { UserModel } from '../../src/models/user';
import { SkillModel } from '../../src/models/skill';
import { RelationshipModel } from '../../src/models/relationship';

/**
 * End-to-end integration test: SkillGraph Core Graph Lifecycle
 *
 * Tests the full entity creation and relationship establishment lifecycle:
 * 1. Seed a User and a Skill
 * 2. Create a HAS_SKILL relationship between them
 * 3. Query the graph and verify the relationship properties
 * 4. Clean up test data
 *
 * Requires a running Neo4j instance (docker compose up -d)
 */
describe('Graph Integration: Core Lifecycle', () => {
  /** Track created IDs for cleanup */
  let testUserId: string;
  let testSkillId: string;
  const testEmail = `integration-test-${Date.now()}@skillgraph.test`;
  const testSkillName = `TypeScript-${Date.now()}`;

  beforeAll(async () => {
    // Initialize DB connection and schema constraints
    await initDb();
  });

  afterAll(async () => {
    // Cleanup: remove test data from Neo4j
    const session = getDriver().session();
    try {
      await session.run(
        `MATCH (u:User {email: $email}) DETACH DELETE u`,
        { email: testEmail }
      );
      await session.run(
        `MATCH (s:Skill {name: $name}) DETACH DELETE s`,
        { name: testSkillName }
      );
    } finally {
      await session.close();
    }
    // Close the driver connection
    await closeDriver();
  });

  // ─── Step 1: Seed entities ───────────────────────────────────────────────

  it('should create a User node in the graph', async () => {
    const user = await UserModel.create({
      email: testEmail,
      name: 'Integration Tester',
    });

    expect(user).toBeDefined();
    expect(user.id).toBeTruthy();
    expect(user.email).toBe(testEmail);
    expect(user.name).toBe('Integration Tester');
    expect(user.createdAt).toBeTruthy();

    testUserId = user.id;
  });

  it('should create a Skill node in the graph', async () => {
    const skill = await SkillModel.create({
      name: testSkillName,
      category: 'programming',
    });

    expect(skill).toBeDefined();
    expect(skill.id).toBeTruthy();
    expect(skill.name).toBe(testSkillName);
    expect(skill.category).toBe('programming');
    expect(skill.createdAt).toBeTruthy();

    testSkillId = skill.id;
  });

  // ─── Step 2: Retrieve entities ──────────────────────────────────────────

  it('should retrieve the created User by id', async () => {
    const user = await UserModel.findById(testUserId);

    expect(user).not.toBeNull();
    expect(user!.id).toBe(testUserId);
    expect(user!.email).toBe(testEmail);
  });

  it('should retrieve the created Skill by id', async () => {
    const skill = await SkillModel.findById(testSkillId);

    expect(skill).not.toBeNull();
    expect(skill!.id).toBe(testSkillId);
    expect(skill!.name).toBe(testSkillName);
  });

  // ─── Step 3: Create and verify the graph relationship ───────────────────

  it('should create a HAS_SKILL relationship between User and Skill', async () => {
    const relationship = await RelationshipModel.createUserSkill({
      userId: testUserId,
      skillId: testSkillId,
      proficiency: 3,
    });

    expect(relationship).not.toBeNull();
    expect(relationship!.userId).toBe(testUserId);
    expect(relationship!.skillId).toBe(testSkillId);
    expect(relationship!.proficiency).toBe(3);
    expect(relationship!.createdAt).toBeTruthy();
  });

  it('should persist the relationship edge in the graph (Cypher query verification)', async () => {
    const session = getDriver().session();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[r:HAS_SKILL]->(s:Skill {id: $skillId})
         RETURN u.id AS userId, s.id AS skillId, r.proficiency AS proficiency`,
        { userId: testUserId, skillId: testSkillId }
      );

      expect(result.records).toHaveLength(1);
      const record = result.records[0];
      expect(record.get('userId')).toBe(testUserId);
      expect(record.get('skillId')).toBe(testSkillId);
      expect(record.get('proficiency')).toBe(3);
    } finally {
      await session.close();
    }
  });

  it('should return skills for the user via getSkillsForUser()', async () => {
    const relationships = await RelationshipModel.getSkillsForUser(testUserId);

    expect(relationships).toHaveLength(1);
    expect(relationships[0].skillId).toBe(testSkillId);
    expect(relationships[0].proficiency).toBe(3);
  });

  // ─── Step 4: Edge cases ──────────────────────────────────────────────────

  it('should return null when creating relationship for non-existent user', async () => {
    const result = await RelationshipModel.createUserSkill({
      userId: 'non-existent-uuid',
      skillId: testSkillId,
    });
    expect(result).toBeNull();
  });

  it('should return null when creating relationship for non-existent skill', async () => {
    const result = await RelationshipModel.createUserSkill({
      userId: testUserId,
      skillId: 'non-existent-uuid',
    });
    expect(result).toBeNull();
  });

  it('should enforce email uniqueness constraint on duplicate user creation', async () => {
    await expect(
      UserModel.create({ email: testEmail, name: 'Duplicate' })
    ).rejects.toThrow();
  });

  it('should enforce name uniqueness constraint on duplicate skill creation', async () => {
    await expect(
      SkillModel.create({ name: testSkillName })
    ).rejects.toThrow();
  });
});
