import { calculateContextualInfluence, calculateEigenTrust, type TrustEdge } from '../../../src/services/reputation/eigenTrust';
import { ReputationService } from '../../../src/services/reputation/reputationService';
import { UPDATE_REPUTATION_SCORES } from '../../../src/db/cypher/reputationQueries';

type RecordLike = {
  get: (key: string) => unknown;
};

function makeRecord(values: Record<string, unknown>): RecordLike {
  return {
    get: (key: string) => values[key],
  };
}

describe('eigenTrust', () => {
  it('keeps symmetric trust for a ring topology', () => {
    const userIds = ['a', 'b', 'c'];
    const edges: TrustEdge[] = [
      { fromUserId: 'a', toUserId: 'b', confidence: 1 },
      { fromUserId: 'b', toUserId: 'c', confidence: 1 },
      { fromUserId: 'c', toUserId: 'a', confidence: 1 },
    ];

    const scores = calculateEigenTrust(userIds, edges);

    expect(scores.a).toBeCloseTo(1 / 3, 4);
    expect(scores.b).toBeCloseTo(1 / 3, 4);
    expect(scores.c).toBeCloseTo(1 / 3, 4);
  });

  it('amplifies dense cluster reputation relative to sparse outsiders', () => {
    const userIds = ['a', 'b', 'c', 'd'];
    const edges: TrustEdge[] = [
      { fromUserId: 'a', toUserId: 'b', confidence: 1 },
      { fromUserId: 'b', toUserId: 'a', confidence: 1 },
      { fromUserId: 'a', toUserId: 'c', confidence: 0.6 },
      { fromUserId: 'c', toUserId: 'a', confidence: 0.8 },
      { fromUserId: 'd', toUserId: 'a', confidence: 0.2 },
      { fromUserId: 'd', toUserId: 'b', confidence: 0.1 },
    ];

    const scores = calculateEigenTrust(userIds, edges);

    expect(scores.a).toBeGreaterThan(scores.d);
    expect(scores.b).toBeGreaterThan(scores.d);
    expect(scores.c).toBeGreaterThan(scores.d);
  });

  it('weights endorsements by source reputation in contextual influence', () => {
    const edges: TrustEdge[] = [
      { fromUserId: 'highRep', toUserId: 'target', confidence: 1 },
      { fromUserId: 'lowRep', toUserId: 'target', confidence: 1 },
      { fromUserId: 'lowRep', toUserId: 'other', confidence: 1 },
    ];

    const influence = calculateContextualInfluence(
      {
        highRep: 0.9,
        lowRep: 0.1,
      },
      edges
    );

    expect(influence.target).toBeCloseTo(0.90909091, 6);
    expect(influence.other).toBeCloseTo(0.09090909, 6);
  });
});

describe('reputationService', () => {
  it('orchestrates EigenTrust calculation and persists scores in batches', async () => {
    const run = jest
      .fn<Promise<{ records: RecordLike[] }>, [string, Record<string, unknown>?]>()
      .mockImplementation(async (query: string) => {
        if (query.includes('MATCH (u:User)')) {
          return {
            records: [
              makeRecord({ userId: 'alice' }),
              makeRecord({ userId: 'bob' }),
              makeRecord({ userId: 'charlie' }),
            ],
          };
        }

        if (query.includes('MATCH (endorser:User)-[:ENDORSED]')) {
          return {
            records: [
              makeRecord({ fromUserId: 'alice', toUserId: 'bob', confidence: 1 }),
              makeRecord({ fromUserId: 'bob', toUserId: 'charlie', confidence: 1 }),
              makeRecord({ fromUserId: 'charlie', toUserId: 'alice', confidence: 1 }),
            ],
          };
        }

        return { records: [] };
      });

    const close = jest.fn<Promise<void>, []>().mockResolvedValue();
    const service = new ReputationService({
      session: () => ({ run, close }),
    });

    const result = await service.recomputeReputation({ batchSize: 2 });

    expect(result.updatedCount).toBe(3);

    const writeCalls = run.mock.calls.filter(([query]) => query === UPDATE_REPUTATION_SCORES);
    expect(writeCalls).toHaveLength(2);

    const firstWriteParams = writeCalls[0]?.[1] as {
      updates: Array<{ userId: string; score: number }>;
    };
    expect(firstWriteParams.updates).toHaveLength(2);
    expect(firstWriteParams.updates[0]?.userId).toBe('alice');
    expect(typeof firstWriteParams.updates[0]?.score).toBe('number');

    const secondWriteParams = writeCalls[1]?.[1] as {
      updates: Array<{ userId: string; score: number }>;
    };
    expect(secondWriteParams.updates).toHaveLength(1);

    expect(close).toHaveBeenCalledTimes(1);
  });
});
