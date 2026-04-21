import { calculateContextualInfluence, calculateEigenTrust, type TrustEdge } from '../../../src/services/reputation/eigenTrust';

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
