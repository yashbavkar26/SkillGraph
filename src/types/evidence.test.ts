import { EvidenceSchema } from './evidence';

describe('EvidenceSchema', () => {
  it('should validate correct input and transform it', () => {
    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      skillId: '660e8400-e29b-41d4-a716-446655440001',
      url: 'https://github.com/user/repo',
      type: 'github',
      metadata: { description: 'My awesome repo' }
    };

    const result = EvidenceSchema.parse(input);

    expect(result.id).toBeDefined();
    expect(result.userId).toBe(input.userId);
    expect(result.skillId).toBe(input.skillId);
    expect(result.url).toBe(input.url);
    expect(result.type).toBe(input.type);
    expect(result.metadata.description).toBe(input.metadata.description);
    expect(result.createdAt).toBeDefined();
  });

  it('should fail on invalid URL', () => {
    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      skillId: '660e8400-e29b-41d4-a716-446655440001',
      url: 'not-a-url',
      type: 'github',
      metadata: {}
    };

    expect(() => EvidenceSchema.parse(input)).toThrow();
  });

  it('should fail on invalid type', () => {
    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      skillId: '660e8400-e29b-41d4-a716-446655440001',
      url: 'https://github.com/user/repo',
      type: 'invalid-type' as any,
      metadata: {}
    };

    expect(() => EvidenceSchema.parse(input)).toThrow();
  });
});
