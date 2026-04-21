import {
  FETCH_REPUTATION_TRUST_EDGES,
  FETCH_REPUTATION_USER_IDS,
  UPDATE_REPUTATION_SCORES,
  buildReputationScoreUpdates,
  type ReputationScoreUpdate,
} from '../../db/cypher/reputationQueries';
import { calculateEigenTrust, type EigenTrustOptions, type TrustEdge } from './eigenTrust';

type Neo4jIntegerLike = {
  toNumber: () => number;
};

type SessionLike = {
  run: (query: string, params?: Record<string, unknown>) => Promise<{ records: any[] }>;
  close: () => Promise<void>;
};

type DriverLike = {
  session: () => SessionLike;
};

export type ReputationRefreshResult = {
  updatedCount: number;
  scores: Record<string, number>;
};

export type ReputationServiceOptions = EigenTrustOptions & {
  batchSize?: number;
};

function asNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as Neo4jIntegerLike).toNumber === 'function'
  ) {
    return (value as Neo4jIntegerLike).toNumber();
  }

  return Number(value ?? 0);
}

function toTrustEdges(records: any[]): TrustEdge[] {
  return records.map((record) => ({
    fromUserId: String(record.get('fromUserId')),
    toUserId: String(record.get('toUserId')),
    confidence: asNumber(record.get('confidence')),
  }));
}

function toUserIds(records: any[]): string[] {
  return records.map((record) => String(record.get('userId')));
}

function chunkUpdates(
  updates: ReputationScoreUpdate[],
  batchSize: number
): ReputationScoreUpdate[][] {
  if (updates.length === 0) {
    return [];
  }

  const chunks: ReputationScoreUpdate[][] = [];
  for (let index = 0; index < updates.length; index += batchSize) {
    chunks.push(updates.slice(index, index + batchSize));
  }
  return chunks;
}

export class ReputationService {
  constructor(private readonly driver?: DriverLike) {}

  private resolveDriver(): DriverLike {
    if (this.driver) {
      return this.driver;
    }

    const neo4jModule = require('../../db/neo4j') as typeof import('../../db/neo4j');
    return neo4jModule.getDriver() as unknown as DriverLike;
  }

  async recomputeReputation(
    options: ReputationServiceOptions = {}
  ): Promise<ReputationRefreshResult> {
    const session = this.resolveDriver().session();
    try {
      const [usersResult, edgesResult] = await Promise.all([
        session.run(FETCH_REPUTATION_USER_IDS),
        session.run(FETCH_REPUTATION_TRUST_EDGES),
      ]);

      const userIds = toUserIds(usersResult.records);
      const edges = toTrustEdges(edgesResult.records);
      const scores = calculateEigenTrust(userIds, edges, options);
      const updates = buildReputationScoreUpdates(scores);

      const batchSize = Math.max(1, Math.floor(options.batchSize ?? 500));
      const batches = chunkUpdates(updates, batchSize);
      const updatedAt = new Date().toISOString();

      for (const batch of batches) {
        await session.run(UPDATE_REPUTATION_SCORES, {
          updatedAt,
          updates: batch,
        });
      }

      return {
        updatedCount: updates.length,
        scores,
      };
    } finally {
      await session.close();
    }
  }
}
