import 'dotenv/config';
import { closeDriver, getDriver, verifyConnectivity } from './neo4j';

/**
 * Cypher statements that establish the core graph schema constraints.
 *
 * These are idempotent and safe to run multiple times.
 */
const CONSTRAINT_STATEMENTS: readonly string[] = [
  `CREATE CONSTRAINT user_email_unique IF NOT EXISTS
   FOR (u:User) REQUIRE u.email IS UNIQUE`,
  `CREATE CONSTRAINT user_id_unique IF NOT EXISTS
   FOR (u:User) REQUIRE u.id IS UNIQUE`,
  `CREATE CONSTRAINT skill_name_unique IF NOT EXISTS
   FOR (s:Skill) REQUIRE s.name IS UNIQUE`,
  `CREATE CONSTRAINT skill_id_unique IF NOT EXISTS
   FOR (s:Skill) REQUIRE s.id IS UNIQUE`,
];

async function verifyRecruiterSearchReadiness(): Promise<void> {
  const session = getDriver().session();
  try {
    const gdsResult = await session.run(
      `SHOW PROCEDURES YIELD name
       WITH collect(name) AS names
       RETURN any(name IN names WHERE name = 'gds.version') AS gdsAvailable`
    );
    const gdsAvailable = Boolean(gdsResult.records[0]?.get('gdsAvailable'));
    if (!gdsAvailable) {
      console.warn(
        '[db] Recruiter search readiness: GDS procedure not found, using non-GDS similarity fallback.'
      );
    }

    const vectorIndexResult = await session.run(
      `SHOW INDEXES YIELD name, type
       WHERE type = 'VECTOR'
       RETURN count(*) AS vectorIndexCount`
    );
    const vectorIndexCount = Number(vectorIndexResult.records[0]?.get('vectorIndexCount') ?? 0);
    if (vectorIndexCount === 0) {
      console.warn(
        '[db] Recruiter search readiness: no VECTOR index found, continuing with relational feature retrieval.'
      );
    }
  } catch (error) {
    console.warn(
      '[db] Recruiter search readiness checks failed; continuing with safe fallback path.',
      error
    );
  } finally {
    await session.close();
  }
}

export async function initializeSchema(): Promise<void> {
  const session = getDriver().session();
  try {
    for (const statement of CONSTRAINT_STATEMENTS) {
      await session.run(statement);
    }
    console.log(`Schema initialized: ${CONSTRAINT_STATEMENTS.length} constraints applied`);
  } finally {
    await session.close();
  }
}

export async function initDb(): Promise<void> {
  console.log('[db] Verifying Neo4j connectivity...');
  await verifyConnectivity();
  console.log('[db] Connected');

  console.log('[db] Initializing schema...');
  await initializeSchema();
  await verifyRecruiterSearchReadiness();
  console.log('[db] Database ready');
}

if (require.main === module) {
  initDb()
    .then(() => closeDriver())
    .catch((err) => {
      console.error('[db] Initialization failed:', err.message);
      process.exit(1);
    });
}