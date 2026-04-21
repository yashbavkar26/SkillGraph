export const FIND_DENSE_ENDORSEMENT_CLUSTERS = `
MATCH (seed:User)
WHERE seed.id IS NOT NULL
WITH seed
ORDER BY seed.id
LIMIT $scanLimit
MATCH (seed)-[:ENDORSED]->(:Endorsement)-[:TO_USER]->(peer:User)
WITH seed, collect(DISTINCT peer) AS outboundPeers
WHERE size(outboundPeers) >= $minOutDegree
WITH seed, outboundPeers,
  [peer IN outboundPeers WHERE (peer)-[:ENDORSED]->(:Endorsement)-[:TO_USER]->(seed)] AS reciprocalPeers
WITH seed,
  size(outboundPeers) AS outboundCount,
  size(reciprocalPeers) AS reciprocalCount,
  [peer IN reciprocalPeers | toString(peer.id)] AS reciprocalPeerIds
WITH seed, outboundCount, reciprocalCount,
  [toString(seed.id)] + reciprocalPeerIds AS candidateUserIds,
  toFloat(reciprocalCount) / toFloat(outboundCount) AS reciprocityRatio
WHERE size(candidateUserIds) >= $minClusterSize
  AND reciprocityRatio >= $minReciprocityRatio
RETURN candidateUserIds AS userIds,
       size(candidateUserIds) AS clusterSize,
       reciprocityRatio
ORDER BY clusterSize DESC, reciprocityRatio DESC
LIMIT $maxClusters
`;

export const CREATE_ANOMALY_FLAGS = `
UNWIND $flags AS flag
MATCH (u:User {id: flag.userId})
CREATE (a:AnomalyFlag {
  id: flag.id,
  runId: flag.runId,
  type: flag.type,
  reason: flag.reason,
  severity: flag.severity,
  source: flag.source,
  metadataJson: flag.metadataJson,
  createdAt: datetime(flag.createdAt)
})
MERGE (u)-[:HAS_ANOMALY_FLAG]->(a)
`;

export type DenseClusterQueryParams = {
  scanLimit: number;
  minOutDegree: number;
  minClusterSize: number;
  minReciprocityRatio: number;
  maxClusters: number;
};

export type AnomalyFlagWriteInput = {
  id: string;
  runId: string;
  userId: string;
  type: string;
  reason: string;
  severity: number;
  source: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AnomalyFlagWriteParams = {
  flags: Array<{
    id: string;
    runId: string;
    userId: string;
    type: string;
    reason: string;
    severity: number;
    source: string;
    metadataJson: string;
    createdAt: string;
  }>;
};

export function buildAnomalyFlagWriteParams(
  flags: AnomalyFlagWriteInput[]
): AnomalyFlagWriteParams {
  return {
    flags: flags.map((flag) => ({
      id: flag.id,
      runId: flag.runId,
      userId: flag.userId,
      type: flag.type,
      reason: flag.reason,
      severity: Number(flag.severity.toFixed(4)),
      source: flag.source,
      metadataJson: JSON.stringify(flag.metadata),
      createdAt: flag.createdAt,
    })),
  };
}
