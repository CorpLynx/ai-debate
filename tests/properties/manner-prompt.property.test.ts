import * as fc from 'fast-check';
import { PromptBuilder } from '../../src/prompts/PromptBuilder';
import { Position } from '../../src/models/Position';
import { PersonalityProfile } from '../../src/models/PersonalityProfile';
import { DebateTactic } from '../../src/models/DebateTactic';

describe('Manner Trait Prompt Properties', () => {
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

  // **Feature: ai-debate-advanced, Property 17: Manner trait affects prompt instructions**
  // **Validates: Requirements 6.1, 6.2, 6.3**
  describe('Property 17: Manner trait affects prompt instructions', () => {
    it('should include formal language guidelines for well-mannered (8-10)', () => {
      fc.assert(
        fc.property(
          validTraitArb,
          fc.double({ min: 8, max: 10, noNaN: true }),
          validTraitArb,
          validTraitArb,
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
            
            // Well-mannered should include formal language and avoid personal attacks
            return prompt.includes('formal') && 
                   prompt.includes('Avoid personal attacks');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include sharp and confrontational language guidelines for abrasive (0-2)', () => {
      fc.assert(
        fc.property(
          validTraitArb,
          fc.double({ min: 0, max: 2, noNaN: true }),
          validTraitArb,
          validTraitArb,
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
            
            // Abrasive should include sharp language and direct confrontation
            return prompt.includes('sharp') && 
                   prompt.includes('direct confrontation');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include conversational but firm language guidelines for moderate manner (3-7)', () => {
      fc.assert(
        fc.property(
          validTraitArb,
          fc.double({ min: 3, max: 7, noNaN: true }),
          validTraitArb,
          validTraitArb,
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
            
            // Moderate manner should include conversational but firm language
            return prompt.includes('conversational but firm');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always include manner guidelines in prompts', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const prompt = builder.buildDebaterPrompt(position, personality, personality.tactics);
            
            // All prompts should include manner guidelines
            return prompt.includes('Manner Guidelines');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce different instructions for different manner levels', () => {
      fc.assert(
        fc.property(
          validTraitArb,
          fc.double({ min: 0, max: 2, noNaN: true }),
          fc.double({ min: 8, max: 10, noNaN: true }),
          validTraitArb,
          validTraitArb,
          validTacticsArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (civility, lowManner, highManner, researchDepth, rhetoricUsage, tactics, position) => {
            const lowMannerProfile: PersonalityProfile = {
              civility,
              manner: lowManner,
              researchDepth,
              rhetoricUsage,
              tactics
            };

            const highMannerProfile: PersonalityProfile = {
              civility,
              manner: highManner,
              researchDepth,
              rhetoricUsage,
              tactics
            };

            const lowPrompt = builder.buildDebaterPrompt(position, lowMannerProfile, tactics);
            const highPrompt = builder.buildDebaterPrompt(position, highMannerProfile, tactics);
            
            // Prompts should be different for different manner levels
            return lowPrompt !== highPrompt;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include specific language guidelines as required', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const prompt = builder.buildDebaterPrompt(position, personality, personality.tactics);
            const mannerInstructions = builder.getMannerInstructions(personality.manner);
            
            // The prompt should include the manner instructions
            return prompt.includes(mannerInstructions);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
