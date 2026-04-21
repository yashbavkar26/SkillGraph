import { randomUUID } from 'crypto';

import {
  CREATE_ANOMALY_FLAGS,
  buildAnomalyFlagWriteParams,
  type AnomalyFlagWriteInput,
} from '../../db/cypher/anomalyQueries';
import {
  CollusionDetector,
  type CollusionCluster,
  type CollusionDetectionOptions,
} from './collusionDetector';

type SessionLike = {
  run: (query: string, params?: Record<string, unknown>) => Promise<{ records: any[] }>;
  close: () => Promise<void>;
};

type DriverLike = {
  session: () => SessionLike;
};

export type DetectionTrigger = 'periodic' | 'graph-change';

export type AnomalyDetectionOptions = CollusionDetectionOptions & {
  trigger?: DetectionTrigger;
  runId?: string;
};

export type AnomalyDetectionResult = {
  runId: string;
  trigger: DetectionTrigger;
  clusters: CollusionCluster[];
  flaggedUserIds: string[];
  flagsCreated: number;
};

function severityFromCluster(cluster: CollusionCluster): number {
  const scaledBySize = Math.min(1, cluster.clusterSize / 8);
  const score = 0.5 * cluster.reciprocityRatio + 0.5 * scaledBySize;
  return Number(score.toFixed(4));
}

export class AnomalyDetectionService {
  private readonly collusionDetector: CollusionDetector;

  constructor(private readonly driver?: DriverLike, detector?: CollusionDetector) {
    this.collusionDetector = detector ?? new CollusionDetector(driver);
  }

  private resolveDriver(): DriverLike {
    if (this.driver) {
      return this.driver;
    }

    const neo4jModule = require('../../db/neo4j') as typeof import('../../db/neo4j');
    return neo4jModule.getDriver() as unknown as DriverLike;
  }

  async runDetection(
    options: AnomalyDetectionOptions = {}
  ): Promise<AnomalyDetectionResult> {
    const trigger = options.trigger ?? 'periodic';
    const runId = options.runId ?? randomUUID();
    const clusters = await this.collusionDetector.detect(options);

    const flagInputs: AnomalyFlagWriteInput[] = [];
    for (const cluster of clusters) {
      for (const userId of cluster.userIds) {
        flagInputs.push({
          id: randomUUID(),
          runId,
          userId,
          type: 'collusion-ring',
          reason: `Detected dense reciprocal endorsement cluster of size ${cluster.clusterSize}`,
          severity: severityFromCluster(cluster),
          source: 'anomaly-detection-service',
          metadata: {
            clusterSize: cluster.clusterSize,
            reciprocityRatio: cluster.reciprocityRatio,
            clusterUserIds: cluster.userIds,
            trigger,
          },
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (flagInputs.length > 0) {
      const session = this.resolveDriver().session();
      try {
        await session.run(CREATE_ANOMALY_FLAGS, buildAnomalyFlagWriteParams(flagInputs));
      } finally {
        await session.close();
      }
    }

    const flaggedUserIds = Array.from(
      new Set(flagInputs.map((flag) => flag.userId))
    ).sort((a, b) => a.localeCompare(b));

    return {
      runId,
      trigger,
      clusters,
      flaggedUserIds,
      flagsCreated: flagInputs.length,
    };
  }
}
