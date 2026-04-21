export type TrustEdge = {
  fromUserId: string;
  toUserId: string;
  confidence: number;
};

export type EigenTrustOptions = {
  alpha?: number;
  maxIterations?: number;
  tolerance?: number;
  seedTrust?: Record<string, number>;
};

function clampNonNegative(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value;
}

function normalizeVector(values: number[]): number[] {
  const sum = values.reduce((acc, value) => acc + value, 0);
  if (sum <= 0) {
    return values.map(() => 0);
  }
  return values.map((value) => value / sum);
}

function buildSeedVector(userIds: string[], seedTrust?: Record<string, number>): number[] {
  if (!seedTrust) {
    return userIds.map(() => 1 / userIds.length);
  }

  const seeded = userIds.map((id) => clampNonNegative(seedTrust[id] ?? 0));
  const normalized = normalizeVector(seeded);
  const hasAnySeed = normalized.some((value) => value > 0);

  if (hasAnySeed) {
    return normalized;
  }

  return userIds.map(() => 1 / userIds.length);
}

function buildTransitionMatrix(
  userIds: string[],
  edges: TrustEdge[],
  indexByUserId: Map<string, number>
): number[][] {
  const size = userIds.length;
  const outgoingSums = new Array<number>(size).fill(0);

  for (const edge of edges) {
    const fromIndex = indexByUserId.get(edge.fromUserId);
    if (fromIndex === undefined) {
      continue;
    }
    outgoingSums[fromIndex] += clampNonNegative(edge.confidence);
  }

  const matrix = Array.from({ length: size }, () => new Array<number>(size).fill(0));
  for (const edge of edges) {
    const fromIndex = indexByUserId.get(edge.fromUserId);
    const toIndex = indexByUserId.get(edge.toUserId);
    if (fromIndex === undefined || toIndex === undefined) {
      continue;
    }

    const outgoing = outgoingSums[fromIndex];
    if (outgoing <= 0) {
      continue;
    }

    matrix[fromIndex][toIndex] += clampNonNegative(edge.confidence) / outgoing;
  }

  return matrix;
}

export function calculateEigenTrust(
  userIds: string[],
  edges: TrustEdge[],
  options: EigenTrustOptions = {}
): Record<string, number> {
  if (userIds.length === 0) {
    return {};
  }

  const alpha = options.alpha ?? 0.15;
  const maxIterations = options.maxIterations ?? 100;
  const tolerance = options.tolerance ?? 1e-8;

  const uniqueUserIds = Array.from(new Set(userIds));
  const indexByUserId = new Map(uniqueUserIds.map((id, index) => [id, index]));
  const transition = buildTransitionMatrix(uniqueUserIds, edges, indexByUserId);
  const seed = buildSeedVector(uniqueUserIds, options.seedTrust);

  let trustVector = [...seed];

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const next = new Array<number>(uniqueUserIds.length).fill(0);

    for (let toIndex = 0; toIndex < uniqueUserIds.length; toIndex += 1) {
      let propagated = 0;
      for (let fromIndex = 0; fromIndex < uniqueUserIds.length; fromIndex += 1) {
        propagated += trustVector[fromIndex] * transition[fromIndex][toIndex];
      }
      next[toIndex] = (1 - alpha) * propagated + alpha * seed[toIndex];
    }

    const normalized = normalizeVector(next);
    const delta = normalized.reduce(
      (acc, value, index) => acc + Math.abs(value - trustVector[index]),
      0
    );

    trustVector = normalized;
    if (delta < tolerance) {
      break;
    }
  }

  return uniqueUserIds.reduce<Record<string, number>>((acc, id, index) => {
    acc[id] = Number(trustVector[index].toFixed(8));
    return acc;
  }, {});
}

export function calculateContextualInfluence(
  scores: Record<string, number>,
  edges: TrustEdge[]
): Record<string, number> {
  const weighted = new Map<string, number>();

  for (const edge of edges) {
    const fromScore = clampNonNegative(scores[edge.fromUserId] ?? 0);
    const confidence = clampNonNegative(edge.confidence);
    const contribution = fromScore * confidence;
    weighted.set(edge.toUserId, (weighted.get(edge.toUserId) ?? 0) + contribution);
  }

  const total = Array.from(weighted.values()).reduce((acc, value) => acc + value, 0);
  if (total <= 0) {
    return {};
  }

  const result: Record<string, number> = {};
  for (const [userId, value] of weighted.entries()) {
    result[userId] = Number((value / total).toFixed(8));
  }
  return result;
}
