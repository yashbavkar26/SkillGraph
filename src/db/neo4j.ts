import neo4j, { Driver, Session, auth } from 'neo4j-driver';

// Credentials are loaded from environment variables — never hardcode (T-01-01 mitigation)
const NEO4J_URI = process.env.NEO4J_URI ?? 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER ?? process.env.NEO4J_USERNAME ?? 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD ?? '';

if (!NEO4J_PASSWORD) {
  throw new Error(
    'NEO4J_PASSWORD environment variable is not set. ' +
    'Copy .env.example to .env and configure your credentials.'
  );
}

/**
 * Singleton Neo4j driver instance.
 * Re-uses a single connection pool throughout application lifetime.
 */
let _driver: Driver | null = null;

export function getDriver(): Driver {
  if (!_driver) {
    _driver = neo4j.driver(
      NEO4J_URI,
      auth.basic(NEO4J_USER, NEO4J_PASSWORD),
      {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 10_000, // ms
        logging: {
          level: 'warn',
          logger: (level, message) => {
            if (process.env.NODE_ENV !== 'test') {
              console.log(`[neo4j:${level}] ${message}`);
            }
          },
        },
      }
    );
  }
  return _driver;
}

/**
 * Open a new database session.
 * Caller MUST close the session (call session.close()) when done.
 */
export function getSession(): Session {
  return getDriver().session();
}

/**
 * Verify the driver can establish a connection to Neo4j.
 * Throws if the connection cannot be made.
 */
export async function verifyConnectivity(): Promise<void> {
  const driver = getDriver();
  await driver.verifyConnectivity();
}

/**
 * Gracefully close the driver and release all connections.
 * Call this on application shutdown.
 */
export async function closeDriver(): Promise<void> {
  if (_driver) {
    await _driver.close();
    _driver = null;
  }
}
