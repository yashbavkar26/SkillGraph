import type { Driver } from 'neo4j-driver';
import { applyIndexes } from '../../db/cypher/performanceOptimizations';

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type ExecuteCachedReadInput<T> = {
  queryType: 'reputation' | 'similarity';
  cypher: string;
  params: Record<string, unknown>;
  mapResult: (records: any[]) => T;
  cacheTtlMs?: number;
};

type QueryOptimizerOptions = {
  maxConcurrentPerType?: number;
  cacheTtlMs?: number;
};

export class QueryOverloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QueryOverloadError';
  }
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function ensureSerializable(value: unknown): void {
  if (value === null) {
    return;
  }

  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      ensureSerializable(entry);
    }
    return;
  }

  if (valueType === 'object') {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      ensureSerializable(entry);
    }
    return;
  }

  throw new Error('Cache parameters must be JSON-serializable primitive structures.');
}

export class QueryOptimizer {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly inFlightByType = new Map<string, number>();
  private readonly maxConcurrentPerType: number;
  private readonly defaultCacheTtlMs: number;
  private indexBootstrapPromise: Promise<void> | null = null;
  private readonly driver?: Driver;

  constructor(driver?: Driver, options: QueryOptimizerOptions = {}) {
    this.driver = driver;
    this.maxConcurrentPerType = Math.max(1, Math.floor(options.maxConcurrentPerType ?? 12));
    this.defaultCacheTtlMs = Math.max(1_000, Math.floor(options.cacheTtlMs ?? 30_000));
  }

  private resolveDriver(): Driver {
    if (this.driver) {
      return this.driver;
    }

    const neo4jModule = require('../../db/neo4j') as typeof import('../../db/neo4j');
    return neo4jModule.getDriver() as Driver;
  }

  private async ensureIndexes(): Promise<void> {
    if (!this.indexBootstrapPromise) {
      this.indexBootstrapPromise = applyIndexes(this.resolveDriver()).then(() => undefined);
    }

    await this.indexBootstrapPromise;
  }

  private getCacheKey(queryType: string, cypher: string, params: Record<string, unknown>): string {
    return `${queryType}:${cypher}:${stableStringify(params)}`;
  }

  private getInflightCount(queryType: string): number {
    return this.inFlightByType.get(queryType) ?? 0;
  }

  private incrementInflight(queryType: string): void {
    this.inFlightByType.set(queryType, this.getInflightCount(queryType) + 1);
  }

  private decrementInflight(queryType: string): void {
    const next = this.getInflightCount(queryType) - 1;
    if (next <= 0) {
      this.inFlightByType.delete(queryType);
      return;
    }
    this.inFlightByType.set(queryType, next);
  }

  async executeCachedRead<T>(input: ExecuteCachedReadInput<T>): Promise<T> {
    await this.ensureIndexes();
    ensureSerializable(input.params);

    const now = Date.now();
    const cacheKey = this.getCacheKey(input.queryType, input.cypher, input.params);
    const cached = this.cache.get(cacheKey) as CacheEntry<T> | undefined;
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    if (this.getInflightCount(input.queryType) >= this.maxConcurrentPerType) {
      throw new QueryOverloadError(
        `Concurrent ${input.queryType} query limit exceeded (${this.maxConcurrentPerType}).`
      );
    }

    this.incrementInflight(input.queryType);
    const session = this.resolveDriver().session();
    try {
      const result = await session.run(input.cypher, input.params);
      const mapped = input.mapResult(result.records);
      const ttl = Math.max(1_000, Math.floor(input.cacheTtlMs ?? this.defaultCacheTtlMs));

      this.cache.set(cacheKey, {
        value: mapped,
        expiresAt: now + ttl,
      });

      return mapped;
    } finally {
      this.decrementInflight(input.queryType);
      await session.close();
    }
  }
}

export const performanceQueryOptimizer = new QueryOptimizer();
