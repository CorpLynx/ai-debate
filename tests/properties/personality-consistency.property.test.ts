/**
 * Property-based tests for personality consistency across rounds
 * 
 * Feature: ai-debate-advanced, Property 11: Personality profile applied to system prompt
 * Validates: Requirements 3.1, 3.2, 12.1, 12.2
 * 
 * This test verifies that personality profiles are consistently applied to system prompts
 * and that all personality traits are included in the generated prompts.
 */

import * as fc from 'fast-check';
import { PromptBuilder } from '../../src/prompts/PromptBuilder';
import { PersonalityProfile } from '../../src/models/PersonalityProfile';
import { DebateTactic } from '../../src/models/DebateTactic';
import { Position } from '../../src/models/Position';

describe('Property 11: Personality profile applied to system prompt', () => {
  const promptBuilder = new PromptBuilder();

  // Arbitrary for generating valid personality profiles
  const personalityProfileArbitrary = fc.record({
    civility: fc.integer({ min: 0, max: 10 }),
    manner: fc.integer({ min: 0, max: 10 }),
    researchDepth: fc.integer({ min: 0, max: 10 }),
    rhetoricUsage: fc.integer({ min: 0, max: 10 }),
    tactics: fc.array(
      fc.constantFrom(...Object.values(DebateTactic)),
      { minLength: 0, maxLength: 3 }
    ),
    customInstructions: fc.option(fc.string(), { nil: undefined })
  }) as fc.Arbitrary<PersonalityProfile>;

  it('should include civility instructions in prompt for any personality profile', () => {
    fc.assert(
      fc.property(personalityProfileArbitrary, (personality) => {
        const prompt = promptBuilder.buildDebaterPrompt(
          Position.AFFIRMATIVE,
          personality,
          personality.tactics
        );

        // Check that civility-related instructions are present
        const civilityKeywords = ['civility', 'respectful', 'dismissive', 'aggressive', 'assertive'];
        const hasCivilityInstructions = civilityKeywords.some(keyword => 
          prompt.toLowerCase().includes(keyword)
        );

        return hasCivilityInstructions;
      }),
      { numRuns: 100 }
    );
  });

  it('should include manner instructions in prompt for any personality profile', () => {
    fc.assert(
      fc.property(personalityProfileArbitrary, (personality) => {
        const prompt = promptBuilder.buildDebaterPrompt(
          Position.AFFIRMATIVE,
          personality,
          personality.tactics
        );

        // Check that manner-related instructions are present
        const mannerKeywords = ['manner', 'formal', 'abrasive', 'sharp', 'conversational'];
        const hasMannerInstructions = mannerKeywords.some(keyword => 
          prompt.toLowerCase().includes(keyword)
        );

        return hasMannerInstructions;
      }),
      { numRuns: 100 }
    );
  });

  it('should include research depth instructions in prompt for any personality profile', () => {
    fc.assert(
      fc.property(personalityProfileArbitrary, (personality) => {
        const prompt = promptBuilder.buildDebaterPrompt(
          Position.AFFIRMATIVE,
          personality,
          personality.tactics
        );

        // Check that research-related instructions are present
        const researchKeywords = ['research', 'sources', 'cite', 'evidence', 'data', 'claims'];
        const hasResearchInstructions = researchKeywords.some(keyword => 
          prompt.toLowerCase().includes(keyword)
        );

        return hasResearchInstructions;
      }),
      { numRuns: 100 }
    );
  });

  it('should include rhetoric usage instructions in prompt for any personality profile', () => {
    fc.assert(
      fc.property(personalityProfileArbitrary, (personality) => {
        const prompt = promptBuilder.buildDebaterPrompt(
          Position.AFFIRMATIVE,
          personality,
          personality.tactics
        );

        // Check that rhetoric-related instructions are present
        const rhetoricKeywords = ['rhetoric', 'emotional', 'logical', 'persuasive', 'analogies'];
        const hasRhetoricInstructions = rhetoricKeywords.some(keyword => 
          prompt.toLowerCase().includes(keyword)
        );

        return hasRhetoricInstructions;
      }),
      { numRuns: 100 }
    );
  });

  it('should include all four personality dimensions in prompt', () => {
    fc.assert(
      fc.property(personalityProfileArbitrary, (personality) => {
        const prompt = promptBuilder.buildDebaterPrompt(
          Position.AFFIRMATIVE,
          personality,
          personality.tactics
        );

        // Verify all four dimensions are present
        const hasCivility = /civility|respectful|dismissive|aggressive|assertive/i.test(prompt);
        const hasManner = /manner|formal|abrasive|sharp|conversational/i.test(prompt);
        const hasResearch = /research|sources|cite|evidence|data|claims/i.test(prompt);
        const hasRhetoric = /rhetoric|emotional|logical|persuasive|analogies/i.test(prompt);

        return hasCivility && hasManner && hasResearch && hasRhetoric;
      }),
      { numRuns: 100 }
    );
  });

  it('should include tactic instructions when tactics are specified', () => {
    fc.assert(
      fc.property(
        personalityProfileArbitrary.filter(p => {
          // Filter out profiles with no tactics or only NONE tactics
          const nonNoneTactics = p.tactics.filter(t => t !== DebateTactic.NONE);
          return nonNoneTactics.length > 0;
        }),
        (personality) => {
          const prompt = promptBuilder.buildDebaterPrompt(
            Position.AFFIRMATIVE,
            personality,
            personality.tactics
          );

          // Check that at least one tactic is mentioned
          const tacticKeywords = [
            'gish gallop', 'strawman', 'ad hominem', 'appeal to emotion',
            'appeal to authority', 'false dilemma', 'slippery slope', 'red herring'
          ];
          
          const hasTacticInstructions = tacticKeywords.some(keyword => 
            prompt.toLowerCase().includes(keyword)
          );

          return hasTacticInstructions;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include custom instructions when provided', () => {
    fc.assert(
      fc.property(
        personalityProfileArbitrary.filter(p => {
          return typeof p.customInstructions === 'string' && p.customInstructions.length > 0;
        }),
        (personality) => {
          const prompt = promptBuilder.buildDebaterPrompt(
            Position.AFFIRMATIVE,
            personality,
            personality.tactics
          );

          // Custom instructions should be included in the prompt
          return prompt.includes(personality.customInstructions!);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate different prompts for different personality profiles', () => {
    fc.assert(
      fc.property(
        personalityProfileArbitrary,
        personalityProfileArbitrary,
        (personality1, personality2) => {
          // Normalize empty custom instructions to undefined for comparison
          const normalized1 = {
            ...personality1,
            customInstructions: personality1.customInstructions || undefined
          };
          const normalized2 = {
            ...personality2,
            customInstructions: personality2.customInstructions || undefined
          };

          // Skip if personalities are identical after normalization
          if (JSON.stringify(normalized1) === JSON.stringify(normalized2)) {
            return true;
          }

          const prompt1 = promptBuilder.buildDebaterPrompt(
            Position.AFFIRMATIVE,
            personality1,
            personality1.tactics
          );
          const prompt2 = promptBuilder.buildDebaterPrompt(
            Position.AFFIRMATIVE,
            personality2,
            personality2.tactics
          );

          // Different personalities should produce different prompts
          return prompt1 !== prompt2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent prompt structure regardless of personality', () => {
    fc.assert(
      fc.property(personalityProfileArbitrary, (personality) => {
        const prompt = promptBuilder.buildDebaterPrompt(
          Position.AFFIRMATIVE,
          personality,
          personality.tactics
        );

        // Check that the prompt has the expected structure
        const hasBasePrompt = prompt.includes('You are a skilled debater');
        const hasRole = prompt.includes('affirmative');
        const hasResponsibilities = prompt.includes('Core Responsibilities');

        return hasBasePrompt && hasRole && hasResponsibilities;
      }),
      { numRuns: 100 }
    );
  });
});
