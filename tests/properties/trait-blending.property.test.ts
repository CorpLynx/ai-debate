import * as fc from 'fast-check';
import { PromptBuilder } from '../../src/prompts/PromptBuilder';
import { Position } from '../../src/models/Position';
import { PersonalityProfile } from '../../src/models/PersonalityProfile';
import { DebateTactic } from '../../src/models/DebateTactic';

describe('Trait Blending Properties', () => {
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

  // **Feature: ai-debate-advanced, Property 18: Multiple traits blended in prompt**
  // **Validates: Requirements 6.4**
  describe('Property 18: Multiple traits blended in prompt', () => {
    it('should include both civility and manner instructions in all prompts', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const prompt = builder.buildDebaterPrompt(position, personality, personality.tactics);
            
            // Both civility and manner guidelines should be present
            const hasCivilityGuidelines = prompt.includes('Civility Guidelines');
            const hasMannerGuidelines = prompt.includes('Manner Guidelines');
            
            return hasCivilityGuidelines && hasMannerGuidelines;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should blend civility and manner without conflicts', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const prompt = builder.buildDebaterPrompt(position, personality, personality.tactics);
            
            // Get individual instructions
            const civilityInstructions = builder.getCivilityInstructions(personality.civility);
            const mannerInstructions = builder.getMannerInstructions(personality.manner);
            
            // Both should be present in the final prompt
            const hasCivility = prompt.includes(civilityInstructions);
            const hasManner = prompt.includes(mannerInstructions);
            
            return hasCivility && hasManner;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain distinct sections for civility and manner', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const prompt = builder.buildDebaterPrompt(position, personality, personality.tactics);
            
            // Check that both sections exist and are separate
            const civilityIndex = prompt.indexOf('Civility Guidelines');
            const mannerIndex = prompt.indexOf('Manner Guidelines');
            
            // Both should exist and be at different positions
            return civilityIndex !== -1 && 
                   mannerIndex !== -1 && 
                   civilityIndex !== mannerIndex;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should blend high civility with high manner without conflicts', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 8, max: 10, noNaN: true }),
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
            
            // High civility + high manner should include respectful and formal language
            return prompt.includes('respectful') && 
                   prompt.includes('formal') &&
                   prompt.includes('Civility Guidelines') &&
                   prompt.includes('Manner Guidelines');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should blend low civility with low manner without conflicts', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 2, noNaN: true }),
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
            
            // Low civility + low manner should include dismissive and sharp language
            return prompt.includes('dismissive') && 
                   prompt.includes('sharp') &&
                   prompt.includes('Civility Guidelines') &&
                   prompt.includes('Manner Guidelines');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should blend contrasting traits (high civility, low manner)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 8, max: 10, noNaN: true }),
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
            
            // Should include both respectful (civility) and sharp (manner) instructions
            return prompt.includes('respectful') && 
                   prompt.includes('sharp') &&
                   prompt.includes('Civility Guidelines') &&
                   prompt.includes('Manner Guidelines');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should blend contrasting traits (low civility, high manner)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 2, noNaN: true }),
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
            
            // Should include both dismissive (civility) and formal (manner) instructions
            return prompt.includes('dismissive') && 
                   prompt.includes('formal') &&
                   prompt.includes('Civility Guidelines') &&
                   prompt.includes('Manner Guidelines');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve custom instructions when blending traits', () => {
      fc.assert(
        fc.property(
          validTraitArb,
          validTraitArb,
          validTraitArb,
          validTraitArb,
          validTacticsArb,
          fc.string({ minLength: 1 }),
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (civility, manner, researchDepth, rhetoricUsage, tactics, customInstructions, position) => {
            const personality: PersonalityProfile = {
              civility,
              manner,
              researchDepth,
              rhetoricUsage,
              tactics,
              customInstructions
            };

            const prompt = builder.buildDebaterPrompt(position, personality, tactics);
            
            // Custom instructions should be present along with trait instructions
            return prompt.includes(customInstructions) &&
                   prompt.includes('Civility Guidelines') &&
                   prompt.includes('Manner Guidelines');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce consistent blending for the same personality profile', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const prompt1 = builder.buildDebaterPrompt(position, personality, personality.tactics);
            const prompt2 = builder.buildDebaterPrompt(position, personality, personality.tactics);
            
            // Same inputs should produce identical outputs
            return prompt1 === prompt2;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
