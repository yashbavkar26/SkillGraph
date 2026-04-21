import {
  FIND_DENSE_ENDORSEMENT_CLUSTERS,
  type DenseClusterQueryParams,
} from '../../db/cypher/anomalyQueries';

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

export type CollusionCluster = {
  userIds: string[];
  clusterSize: number;
  reciprocityRatio: number;
};

export type CollusionDetectionOptions = Partial<DenseClusterQueryParams>;

const DEFAULTS: DenseClusterQueryParams = {
  scanLimit: 400,
  minOutDegree: 3,
  minClusterSize: 3,
  minReciprocityRatio: 0.7,
  maxClusters: 25,
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

function normalizeUserIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.map((item) => String(item)))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function toCluster(record: any): CollusionCluster | null {
  const userIds = normalizeUserIds(record.get('userIds'));
  if (userIds.length === 0) {
    return null;
  }

  const clusterSize = Math.max(userIds.length, asNumber(record.get('clusterSize')));
  const reciprocityRatio = asNumber(record.get('reciprocityRatio'));

  return {
    userIds,
    clusterSize,
    reciprocityRatio: Number(reciprocityRatio.toFixed(6)),
  };
}

export class CollusionDetector {
  constructor(private readonly driver?: DriverLike) {}

  private resolveDriver(): DriverLike {
    if (this.driver) {
      return this.driver;
    }

    const neo4jModule = require('../../db/neo4j') as typeof import('../../db/neo4j');
    return neo4jModule.getDriver() as unknown as DriverLike;
  }

  private toQueryParams(options: CollusionDetectionOptions): DenseClusterQueryParams {
    return {
      scanLimit: Math.max(1, Math.floor(options.scanLimit ?? DEFAULTS.scanLimit)),
      minOutDegree: Math.max(1, Math.floor(options.minOutDegree ?? DEFAULTS.minOutDegree)),
      minClusterSize: Math.max(
        2,
        Math.floor(options.minClusterSize ?? DEFAULTS.minClusterSize)
      ),
      minReciprocityRatio: Math.min(
        1,
        Math.max(0, options.minReciprocityRatio ?? DEFAULTS.minReciprocityRatio)
      ),
      maxClusters: Math.max(1, Math.floor(options.maxClusters ?? DEFAULTS.maxClusters)),
    };
  }

  async detect(options: CollusionDetectionOptions = {}): Promise<CollusionCluster[]> {
    const params = this.toQueryParams(options);
    const session = this.resolveDriver().session();

    try {
      const result = await session.run(FIND_DENSE_ENDORSEMENT_CLUSTERS, params);
      const deduped = new Map<string, CollusionCluster>();

      for (const record of result.records) {
        const cluster = toCluster(record);
        if (!cluster) {
          continue;
        }

        if (cluster.userIds.length < params.minClusterSize) {
          continue;
        }

        if (cluster.reciprocityRatio < params.minReciprocityRatio) {
          continue;
        }

        const key = cluster.userIds.join('|');
        if (!deduped.has(key)) {
          deduped.set(key, cluster);
        }
      }

      return Array.from(deduped.values());
    } finally {
      await session.close();
    }
  }
}
