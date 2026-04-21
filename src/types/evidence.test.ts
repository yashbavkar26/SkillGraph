import { EvidenceInputSchema, EvidenceSchema } from './evidence';
import { v4 as uuidv4 } from 'uuid';

describe('Evidence schemas', () => {
  it('should validate correct input and allow creation of Evidence object', () => {
    const input = {
      skillId: uuidv4(),
      url: 'https://github.com/user/repo',
      type: 'github' as const,
      metadata: { description: 'My awesome repo' }
    };

    const validatedInput = EvidenceInputSchema.parse(input);
    
    const evidence: any = {
      ...validatedInput,
      id: uuidv4(),
      userId: uuidv4(),
      createdAt: new Date().toISOString()
    };

    expect(EvidenceSchema.parse(evidence)).toEqual(evidence);
  });

  it('should fail on invalid URL', () => {
    const input = {
      skillId: uuidv4(),
      url: 'not-a-url',
      type: 'github' as const,
      metadata: {}
    };

    expect(() => EvidenceInputSchema.parse(input)).toThrow();
  });

  it('should fail on invalid type', () => {
    const input = {
      skillId: uuidv4(),
      url: 'https://github.com/user/repo',
      type: 'invalid-type' as any,
      metadata: {}
    };

    expect(() => EvidenceInputSchema.parse(input)).toThrow();
  });
});
