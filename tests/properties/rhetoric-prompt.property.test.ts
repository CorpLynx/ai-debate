import * as fc from 'fast-check';
import { PromptBuilder } from '../../src/prompts/PromptBuilder';
import { Position } from '../../src/models/Position';
import { PersonalityProfile } from '../../src/models/PersonalityProfile';
import { DebateTactic } from '../../src/models/DebateTactic';

describe('Rhetoric Usage Trait Prompt Properties', () => {
  const builder = new PromptBuilder();

  // Arbitrary for valid trait values (0-10)
  const validTraitArb = fc.double({ min: 0, max: 10, noNaN: true });

  // Arbitrary for valid tactics
  const validTacticsArb = fc.array(
    fc.constantFrom(...Object.values(DebateTactic)),
    { minLength: 0, maxLength: 5 }
  );

  // Arbitrary for valid personality profiles
  const validProfileArb = fc.record({
    civility: validTraitArb,
    manner: validTraitArb,
    researchDepth: validTraitArb,
    rhetoricUsage: validTraitArb,
    tactics: validTacticsArb,
    name: fc.option(fc.string(), { nil: undefined }),
    customInstructions: fc.option(fc.string(), { nil: undefined })
  });

  // **Feature: ai-debate-advanced, Property 20: Rhetoric usage affects prompt instructions**
  // **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
  describe('Property 20: Rhetoric usage affects prompt instructions', () => {
    it('should include logical argument guidelines for low rhetoric (0-2)', () => {
      fc.assert(
        fc.property(
          validTraitArb,
          validTraitArb,
          validTraitArb,
          fc.double({ min: 0, max: 2, noNaN: true }),
          validTacticsArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (civility, manner, researchDepth, rhetoricUsage, tactics, position) => {
            const personality: PersonalityProfile = {
              civility,
              manner,
              researchDepth,
              rhetoricUsage,
              tactics
            };

            const prompt = builder.buildDebaterPrompt(position, personality, tactics);
            
            // Low rhetoric should focus on logical arguments and evidence
            return prompt.includes('logical arguments') && 
                   prompt.includes('evidence');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include emotional appeals and persuasive techniques for high rhetoric (8-10)', () => {
      fc.assert(
        fc.property(
          validTraitArb,
          validTraitArb,
          validTraitArb,
          fc.double({ min: 8, max: 10, noNaN: true }),
          validTacticsArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (civility, manner, researchDepth, rhetoricUsage, tactics, position) => {
            const personality: PersonalityProfile = {
              civility,
              manner,
              researchDepth,
              rhetoricUsage,
              tactics
            };

            const prompt = builder.buildDebaterPrompt(position, personality, tactics);
            
            // High rhetoric should include emotional appeals and persuasive techniques
            return prompt.includes('emotional appeals') && 
                   prompt.includes('persuasive techniques');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include blended approach for moderate rhetoric (3-7)', () => {
      fc.assert(
        fc.property(
          validTraitArb,
          validTraitArb,
          validTraitArb,
          fc.double({ min: 3, max: 7, noNaN: true }),
          validTacticsArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (civility, manner, researchDepth, rhetoricUsage, tactics, position) => {
            const personality: PersonalityProfile = {
              civility,
              manner,
              researchDepth,
              rhetoricUsage,
              tactics
            };

            const prompt = builder.buildDebaterPrompt(position, personality, tactics);
            
            // Moderate rhetoric should blend logic with persuasive elements
            return prompt.includes('Blend logical arguments') && 
                   prompt.includes('persuasive elements');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include examples of rhetorical techniques for high rhetoric', () => {
      fc.assert(
        fc.property(
          validTraitArb,
          validTraitArb,
          validTraitArb,
          fc.double({ min: 8, max: 10, noNaN: true }),
          validTacticsArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (civility, manner, researchDepth, rhetoricUsage, tactics, position) => {
            const personality: PersonalityProfile = {
              civility,
              manner,
              researchDepth,
              rhetoricUsage,
              tactics
            };

            const prompt = builder.buildDebaterPrompt(position, personality, tactics);
            
            // High rhetoric should include examples of techniques (Requirement 8.4)
            return prompt.includes('Examples of techniques') || 
                   prompt.includes('analogies') ||
                   prompt.includes('metaphors');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always include rhetoric guidelines in prompts', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const prompt = builder.buildDebaterPrompt(position, personality, personality.tactics);
            
            // All prompts should include rhetoric guidelines
            return prompt.includes('Rhetoric Guidelines');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce different instructions for different rhetoric levels', () => {
      fc.assert(
        fc.property(
          validTraitArb,
          validTraitArb,
          validTraitArb,
          fc.double({ min: 0, max: 2, noNaN: true }),
          fc.double({ min: 8, max: 10, noNaN: true }),
          validTacticsArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (civility, manner, researchDepth, lowRhetoric, highRhetoric, tactics, position) => {
            const lowRhetoricProfile: PersonalityProfile = {
              civility,
              manner,
              researchDepth,
              rhetoricUsage: lowRhetoric,
              tactics
            };

            const highRhetoricProfile: PersonalityProfile = {
              civility,
              manner,
              researchDepth,
              rhetoricUsage: highRhetoric,
              tactics
            };

            const lowPrompt = builder.buildDebaterPrompt(position, lowRhetoricProfile, tactics);
            const highPrompt = builder.buildDebaterPrompt(position, highRhetoricProfile, tactics);
            
            // Prompts should be different for different rhetoric levels
            return lowPrompt !== highPrompt;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include specific rhetoric guidelines as required', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const prompt = builder.buildDebaterPrompt(position, personality, personality.tactics);
            const rhetoricInstructions = builder.getRhetoricInstructions(personality.rhetoricUsage);
            
            // The prompt should include the rhetoric instructions
            return prompt.includes(rhetoricInstructions);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
