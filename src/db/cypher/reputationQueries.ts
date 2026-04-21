export const FETCH_REPUTATION_USER_IDS = `
MATCH (u:User)
RETURN toString(u.id) AS userId
`;

export const FETCH_REPUTATION_TRUST_EDGES = `
MATCH (endorser:User)-[:ENDORSED]->(e:Endorsement)-[:TO_USER]->(recipient:User)
RETURN
  toString(endorser.id) AS fromUserId,
  toString(recipient.id) AS toUserId,
  coalesce(toFloat(e.weight), 1.0) AS confidence
`;

export const UPDATE_REPUTATION_SCORES = `
UNWIND $updates AS update
MATCH (u:User {id: update.userId})
SET u.reputationScore = update.score,
    u.reputationUpdatedAt = datetime($updatedAt)
`;

export type ReputationScoreUpdate = {
  userId: string;
  score: number;
};

export function buildReputationScoreUpdates(
  scores: Record<string, number>
): ReputationScoreUpdate[] {
  return Object.entries(scores)
    .map(([userId, score]) => ({
      userId,
      score: Number(score.toFixed(8)),
    }))
    .sort((a, b) => a.userId.localeCompare(b.userId));
}
