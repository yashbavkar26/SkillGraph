import {
  CREATE_ANOMALY_FLAGS,
  FIND_DENSE_ENDORSEMENT_CLUSTERS,
} from '../../../src/db/cypher/anomalyQueries';
import { AnomalyDetectionService } from '../../../src/services/reputation/anomalyDetection';
import { CollusionDetector } from '../../../src/services/reputation/collusionDetector';

type RecordLike = {
  get: (key: string) => unknown;
};

function makeRecord(values: Record<string, unknown>): RecordLike {
  return {
    get: (key: string) => values[key],
  };
}

describe('collusion detector', () => {
  it('detects dense reciprocal clusters for collusion topologies', async () => {
    const run = jest
      .fn<Promise<{ records: RecordLike[] }>, [string, Record<string, unknown>?]>()
      .mockResolvedValue({
        records: [
          makeRecord({ userIds: ['u1', 'u2', 'u3'], clusterSize: 3, reciprocityRatio: 0.9 }),
          makeRecord({ userIds: ['u3', 'u2', 'u1'], clusterSize: 3, reciprocityRatio: 0.9 }),
        ],
      });

    const close = jest.fn<Promise<void>, []>().mockResolvedValue();
    const detector = new CollusionDetector({
      session: () => ({ run, close }),
    });

    const clusters = await detector.detect({
      scanLimit: 120,
      minOutDegree: 2,
      minClusterSize: 3,
      minReciprocityRatio: 0.75,
      maxClusters: 10,
    });

    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.userIds).toEqual(['u1', 'u2', 'u3']);
    expect(clusters[0]?.clusterSize).toBe(3);
    expect(clusters[0]?.reciprocityRatio).toBeCloseTo(0.9, 6);

    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(FIND_DENSE_ENDORSEMENT_CLUSTERS, {
      scanLimit: 120,
      minOutDegree: 2,
      minClusterSize: 3,
      minReciprocityRatio: 0.75,
      maxClusters: 10,
    });
    expect(close).toHaveBeenCalledTimes(1);
  });
});

describe('anomaly detection service', () => {
  it('orchestrates collusion detection and writes anomaly flags', async () => {
    const run = jest
      .fn<Promise<{ records: RecordLike[] }>, [string, Record<string, unknown>?]>()
      .mockImplementation(async (query: string) => {
        if (query === FIND_DENSE_ENDORSEMENT_CLUSTERS) {
          return {
            records: [
              makeRecord({ userIds: ['x', 'y', 'z'], clusterSize: 3, reciprocityRatio: 0.88 }),
            ],
          };
        }

        return { records: [] };
      });

    const close = jest.fn<Promise<void>, []>().mockResolvedValue();
    const service = new AnomalyDetectionService({
      session: () => ({ run, close }),
    });

    const result = await service.runDetection({ trigger: 'graph-change', runId: 'run-123' });

    expect(result.runId).toBe('run-123');
    expect(result.trigger).toBe('graph-change');
    expect(result.clusters).toHaveLength(1);
    expect(result.flaggedUserIds).toEqual(['x', 'y', 'z']);
    expect(result.flagsCreated).toBe(3);

    const writeCall = run.mock.calls.find(([query]) => query === CREATE_ANOMALY_FLAGS);
    expect(writeCall).toBeDefined();

    const writeParams = writeCall?.[1] as {
      flags: Array<{
        userId: string;
        type: string;
        reason: string;
        severity: number;
        metadataJson: string;
        runId: string;
      }>;
    };

    expect(writeParams.flags).toHaveLength(3);
    expect(writeParams.flags.map((flag) => flag.userId).sort()).toEqual(['x', 'y', 'z']);
    expect(writeParams.flags.every((flag) => flag.type === 'collusion-ring')).toBe(true);
    expect(writeParams.flags.every((flag) => flag.runId === 'run-123')).toBe(true);

    const parsedMetadata = JSON.parse(writeParams.flags[0]?.metadataJson ?? '{}') as {
      clusterSize?: number;
      reciprocityRatio?: number;
      trigger?: string;
    };
    expect(parsedMetadata.clusterSize).toBe(3);
    expect(parsedMetadata.reciprocityRatio).toBeCloseTo(0.88, 6);
    expect(parsedMetadata.trigger).toBe('graph-change');

    expect(close).toHaveBeenCalled();
  });

  it('skips write query when no anomaly clusters are found', async () => {
    const run = jest
      .fn<Promise<{ records: RecordLike[] }>, [string, Record<string, unknown>?]>()
      .mockImplementation(async (query: string) => {
        if (query === FIND_DENSE_ENDORSEMENT_CLUSTERS) {
          return { records: [] };
        }
        return { records: [] };
      });

    const close = jest.fn<Promise<void>, []>().mockResolvedValue();
    const service = new AnomalyDetectionService({
      session: () => ({ run, close }),
    });

    const result = await service.runDetection({ runId: 'run-empty' });

    expect(result.runId).toBe('run-empty');
    expect(result.flagsCreated).toBe(0);
    expect(result.flaggedUserIds).toEqual([]);
    expect(run.mock.calls.some(([query]) => query === CREATE_ANOMALY_FLAGS)).toBe(false);
    expect(close).toHaveBeenCalledTimes(1);
  });
});
