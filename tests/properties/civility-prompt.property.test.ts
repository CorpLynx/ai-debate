import * as fc from 'fast-check';
import { PromptBuilder } from '../../src/prompts/PromptBuilder';
import { Position } from '../../src/models/Position';
import { PersonalityProfile } from '../../src/models/PersonalityProfile';
import { DebateTactic } from '../../src/models/DebateTactic';

describe('Civility Trait Prompt Properties', () => {
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

  // **Feature: ai-debate-advanced, Property 16: Civility trait affects prompt instructions**
  // **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
  describe('Property 16: Civility trait affects prompt instructions', () => {
    it('should include respectful language guidelines for high civility (8-10)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 8, max: 10, noNaN: true }),
          validTraitArb,
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
            
            // High civility should include respectful language and acknowledgment of valid points
            return prompt.includes('respectful') && 
                   prompt.includes('Acknowledge valid points');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include dismissive and aggressive language guidelines for low civility (0-2)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 2, noNaN: true }),
          validTraitArb,
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
            
            // Low civility should include dismissive and aggressive language
            return prompt.includes('dismissive') && 
                   prompt.includes('aggressively');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include balanced language guidelines for moderate civility (3-7)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 3, max: 7, noNaN: true }),
          validTraitArb,
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
            
            // Moderate civility should include balanced approach
            return prompt.includes('Balance respect with assertiveness');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always include civility guidelines in prompts', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const prompt = builder.buildDebaterPrompt(position, personality, personality.tactics);
            
            // All prompts should include civility guidelines
            return prompt.includes('Civility Guidelines');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce different instructions for different civility levels', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 2, noNaN: true }),
          fc.double({ min: 8, max: 10, noNaN: true }),
          validTraitArb,
          validTraitArb,
          validTraitArb,
          validTacticsArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (lowCivility, highCivility, manner, researchDepth, rhetoricUsage, tactics, position) => {
            const lowCivilityProfile: PersonalityProfile = {
              civility: lowCivility,
              manner,
              researchDepth,
              rhetoricUsage,
              tactics
            };

            const highCivilityProfile: PersonalityProfile = {
              civility: highCivility,
              manner,
              researchDepth,
              rhetoricUsage,
              tactics
            };

            const lowPrompt = builder.buildDebaterPrompt(position, lowCivilityProfile, tactics);
            const highPrompt = builder.buildDebaterPrompt(position, highCivilityProfile, tactics);
            
            // Prompts should be different for different civility levels
            return lowPrompt !== highPrompt;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include specific language guidelines as required by 5.4', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const prompt = builder.buildDebaterPrompt(position, personality, personality.tactics);
            const civilityInstructions = builder.getCivilityInstructions(personality.civility);
            
            // The prompt should include the civility instructions
            return prompt.includes(civilityInstructions);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
