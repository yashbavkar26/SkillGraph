import 'dotenv/config';
import { getDriver, verifyConnectivity, closeDriver } from './neo4j';

/**
 * Cypher statements that establish the core graph schema constraints.
 *
 * These are idempotent — safe to run multiple times. Using
 * `CREATE CONSTRAINT IF NOT EXISTS` prevents errors on re-initialization.
 */
const CONSTRAINT_STATEMENTS: readonly string[] = [
  // User node: email must be unique (core identity)
  `CREATE CONSTRAINT user_email_unique IF NOT EXISTS
   FOR (u:User) REQUIRE u.email IS UNIQUE`,

  // User node: id must be unique (surrogate key)
  `CREATE CONSTRAINT user_id_unique IF NOT EXISTS
   FOR (u:User) REQUIRE u.id IS UNIQUE`,

  // Skill node: name must be unique (canonical skills only)
  `CREATE CONSTRAINT skill_name_unique IF NOT EXISTS
   FOR (s:Skill) REQUIRE s.name IS UNIQUE`,

  // Skill node: id must be unique (surrogate key)
  `CREATE CONSTRAINT skill_id_unique IF NOT EXISTS
   FOR (s:Skill) REQUIRE s.id IS UNIQUE`,
];

/**
 * Apply all schema constraints to the Neo4j database.
 * Idempotent — safe to call on every startup.
 */
export async function initializeSchema(): Promise<void> {
  const session = getDriver().session();
  try {
    for (const statement of CONSTRAINT_STATEMENTS) {
      await session.run(statement);
    }
    console.log(`✓ Schema initialized — ${CONSTRAINT_STATEMENTS.length} constraints applied`);
  } finally {
    await session.close();
  }
}

/**
 * Full database initialization sequence:
 * 1. Verify connectivity
 * 2. Apply schema constraints
 *
 * Call this once on application startup, or run directly via `npm run db:init`.
 */
export async function initDb(): Promise<void> {
  console.log('[db] Verifying Neo4j connectivity...');
  await verifyConnectivity();
  console.log('[db] Connected ✓');

  console.log('[db] Initializing schema...');
  await initializeSchema();
  console.log('[db] Database ready ✓');
}

// Allow running directly: `ts-node src/db/schema.ts`
if (require.main === module) {
  initDb()
    .then(() => closeDriver())
    .catch((err) => {
      console.error('[db] Initialization failed:', err.message);
      process.exit(1);
    });
}
