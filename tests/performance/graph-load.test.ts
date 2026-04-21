import { applyIndexes, PERFORMANCE_INDEX_STATEMENTS } from '../../src/db/cypher/performanceOptimizations';
import {
  QueryOptimizer,
  QueryOverloadError,
} from '../../src/services/performance/queryOptimizer';

type RecordLike = {
  get: (key: string) => unknown;
};

type SessionLike = {
  run: jest.Mock<Promise<{ records: RecordLike[] }>, [string, Record<string, unknown>?]>;
  close: jest.Mock<Promise<void>, []>;
};

type DriverLike = {
  session: jest.Mock<SessionLike, []>;
};

function makeRecord(values: Record<string, unknown>): RecordLike {
  return {
    get: (key: string) => values[key],
  };
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe('performance query optimization', () => {
  it('query optimization applies required indexes for traversal read paths', async () => {
    const run = jest.fn<Promise<{ records: RecordLike[] }>, [string, Record<string, unknown>?]>()
      .mockResolvedValue({ records: [] });
    const close = jest.fn<Promise<void>, []>().mockResolvedValue();

    const driver = {
      session: jest.fn(() => ({ run, close })),
    } as unknown as DriverLike;

    const result = await applyIndexes(driver as any);

    expect(result.appliedStatements).toBe(PERFORMANCE_INDEX_STATEMENTS.length);
    expect(run.mock.calls.map((call) => call[0])).toEqual(PERFORMANCE_INDEX_STATEMENTS);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('query optimization caches repeated similarity requests to reduce Neo4j load', async () => {
    const run = jest
      .fn<Promise<{ records: RecordLike[] }>, [string, Record<string, unknown>?]>()
      .mockResolvedValue({ records: [makeRecord({ candidateId: 'candidate-1' })] });
    const close = jest.fn<Promise<void>, []>().mockResolvedValue();
    const driver = {
      session: jest.fn(() => ({ run, close })),
    } as unknown as DriverLike;

    const optimizer = new QueryOptimizer(driver as any, {
      maxConcurrentPerType: 2,
      cacheTtlMs: 10_000,
    });

    const input = {
      queryType: 'similarity' as const,
      cypher: 'MATCH (u:User) RETURN u.id AS candidateId',
      params: { recruiterId: 'r-1', topK: 5 },
      mapResult: (records: RecordLike[]) => records.map((record) => String(record.get('candidateId'))),
    };

    const first = await optimizer.executeCachedRead(input);
    const second = await optimizer.executeCachedRead(input);

    expect(first).toEqual(['candidate-1']);
    expect(second).toEqual(['candidate-1']);
    expect(run).toHaveBeenCalledTimes(PERFORMANCE_INDEX_STATEMENTS.length + 1);
  });

  it('concurrency guardrails reject excess in-flight intensive queries', async () => {
    const gate = deferred<{ records: RecordLike[] }>();
    let runCalls = 0;
    const run = jest
      .fn<Promise<{ records: RecordLike[] }>, [string, Record<string, unknown>?]>()
      .mockImplementation(async () => {
        runCalls += 1;
        if (runCalls <= PERFORMANCE_INDEX_STATEMENTS.length) {
          return { records: [] };
        }

        return gate.promise;
      });

    const close = jest.fn<Promise<void>, []>().mockResolvedValue();
    const driver = {
      session: jest.fn(() => ({ run, close })),
    } as unknown as DriverLike;

    const optimizer = new QueryOptimizer(driver as any, {
      maxConcurrentPerType: 1,
      cacheTtlMs: 1_000,
    });

    const firstPromise = optimizer.executeCachedRead({
      queryType: 'reputation',
      cypher: 'MATCH (u:User) RETURN u.id AS userId',
      params: { batch: 1 },
      mapResult: (records: RecordLike[]) => records.length,
      cacheTtlMs: 1_000,
    });

    await Promise.resolve();

    await expect(
      optimizer.executeCachedRead({
        queryType: 'reputation',
        cypher: 'MATCH (u:User) RETURN u.id AS userId',
        params: { batch: 2 },
        mapResult: (records: RecordLike[]) => records.length,
        cacheTtlMs: 1_000,
      })
    ).rejects.toBeInstanceOf(QueryOverloadError);

    gate.resolve({ records: [makeRecord({ userId: 'user-1' })] });
    await expect(firstPromise).resolves.toBe(1);
  });
});
