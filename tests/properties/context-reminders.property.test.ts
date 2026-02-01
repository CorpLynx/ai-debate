/**
 * Property-based tests for personality reminders in context
 * 
 * Feature: ai-debate-advanced, Property 27: Personality reminders in context
 * Validates: Requirements 12.3
 * 
 * This test verifies that personality reminders are included in context
 * for each round to maintain consistency across the debate.
 */

import * as fc from 'fast-check';
import { PromptBuilder } from '../../src/prompts/PromptBuilder';
import { PersonalityProfile } from '../../src/models/PersonalityProfile';
import { DebateTactic } from '../../src/models/DebateTactic';

describe('Property 27: Personality reminders in context', () => {
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

  it('should generate non-empty context reminders for any personality profile', () => {
    fc.assert(
      fc.property(personalityProfileArbitrary, (personality) => {
        const reminder = promptBuilder.buildContextReminder(personality);

        // Reminder should not be empty
        return reminder.length > 0;
      }),
      { numRuns: 100 }
    );
  });

  it('should include civility reminders in context', () => {
    fc.assert(
      fc.property(personalityProfileArbitrary, (personality) => {
        const reminder = promptBuilder.buildContextReminder(personality);

        // Check for civility-related keywords
        const civilityKeywords = [
          'respectful', 'courteous', 'challenging', 'aggressively',
          'respect', 'assertiveness', 'assertive'
        ];
        
        const hasCivilityReminder = civilityKeywords.some(keyword => 
          reminder.toLowerCase().includes(keyword)
        );

        return hasCivilityReminder;
      }),
      { numRuns: 100 }
    );
  });

  it('should include manner reminders in context', () => {
    fc.assert(
      fc.property(personalityProfileArbitrary, (personality) => {
        const reminder = promptBuilder.buildContextReminder(personality);

        // Check for manner-related keywords
        const mannerKeywords = [
          'formal', 'professional', 'sharp', 'direct',
          'conversational', 'firm', 'tone'
        ];
        
        const hasMannerReminder = mannerKeywords.some(keyword => 
          reminder.toLowerCase().includes(keyword)
        );

        return hasMannerReminder;
      }),
      { numRuns: 100 }
    );
  });

  it('should include research depth reminders in context', () => {
    fc.assert(
      fc.property(personalityProfileArbitrary, (personality) => {
        const reminder = promptBuilder.buildContextReminder(personality);

        // Check for research-related keywords
        const researchKeywords = [
          'citing', 'sources', 'evidence', 'claims',
          'common knowledge', 'balance', 'arguments'
        ];
        
        const hasResearchReminder = researchKeywords.some(keyword => 
          reminder.toLowerCase().includes(keyword)
        );

        return hasResearchReminder;
      }),
      { numRuns: 100 }
    );
  });

  it('should include rhetoric usage reminders in context', () => {
    fc.assert(
      fc.property(personalityProfileArbitrary, (personality) => {
        const reminder = promptBuilder.buildContextReminder(personality);

        // Check for rhetoric-related keywords
        const rhetoricKeywords = [
          'emotional', 'appeals', 'persuasive', 'logical',
          'logic', 'blend', 'techniques'
        ];
        
        const hasRhetoricReminder = rhetoricKeywords.some(keyword => 
          reminder.toLowerCase().includes(keyword)
        );

        return hasRhetoricReminder;
      }),
      { numRuns: 100 }
    );
  });

  it('should include all four personality dimensions in reminders', () => {
    fc.assert(
      fc.property(personalityProfileArbitrary, (personality) => {
        const reminder = promptBuilder.buildContextReminder(personality);

        // Verify all four dimensions are present
        const hasCivility = /respectful|courteous|challenging|aggressively|respect|assertiveness|assertive/i.test(reminder);
        const hasManner = /formal|professional|sharp|direct|conversational|firm|tone/i.test(reminder);
        const hasResearch = /citing|sources|evidence|claims|common knowledge|balance|arguments/i.test(reminder);
        const hasRhetoric = /emotional|appeals|persuasive|logical|logic|blend|techniques/i.test(reminder);

        return hasCivility && hasManner && hasResearch && hasRhetoric;
      }),
      { numRuns: 100 }
    );
  });

  it('should include tactic reminders when tactics are specified', () => {
    fc.assert(
      fc.property(
        personalityProfileArbitrary.filter(p => {
          const nonNoneTactics = p.tactics.filter(t => t !== DebateTactic.NONE);
          return nonNoneTactics.length > 0;
        }),
        (personality) => {
          const reminder = promptBuilder.buildContextReminder(personality);

          // Should mention tactics or "using"
          const hasTacticReminder = /using|continue using/i.test(reminder);

          return hasTacticReminder;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate different reminders for different personalities', () => {
    fc.assert(
      fc.property(
        personalityProfileArbitrary,
        personalityProfileArbitrary,
        (personality1, personality2) => {
          // Skip if personalities are identical
          if (JSON.stringify(personality1) === JSON.stringify(personality2)) {
            return true;
          }

          // Skip if personalities are very similar (differ only in moderate ranges)
          // Two personalities with similar trait values may generate the same reminder text
          const hasMeaningfulDifference = 
            Math.abs(personality1.civility - personality2.civility) >= 3 ||
            Math.abs(personality1.manner - personality2.manner) >= 3 ||
            Math.abs(personality1.researchDepth - personality2.researchDepth) >= 3 ||
            Math.abs(personality1.rhetoricUsage - personality2.rhetoricUsage) >= 3 ||
            JSON.stringify(personality1.tactics) !== JSON.stringify(personality2.tactics);

          if (!hasMeaningfulDifference) {
            return true; // Skip this test case
          }

          const reminder1 = promptBuilder.buildContextReminder(personality1);
          const reminder2 = promptBuilder.buildContextReminder(personality2);

          // Different personalities should produce different reminders
          return reminder1 !== reminder2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have consistent reminder format with header', () => {
    fc.assert(
      fc.property(personalityProfileArbitrary, (personality) => {
        const reminder = promptBuilder.buildContextReminder(personality);

        // Should have "Personality Reminders:" header
        return reminder.includes('Personality Reminders:');
      }),
      { numRuns: 100 }
    );
  });

  it('should use bullet points for reminders', () => {
    fc.assert(
      fc.property(personalityProfileArbitrary, (personality) => {
        const reminder = promptBuilder.buildContextReminder(personality);

        // Should contain bullet points (-)
        return reminder.includes('- ');
      }),
      { numRuns: 100 }
    );
  });

  it('should be concise and suitable for context inclusion', () => {
    fc.assert(
      fc.property(personalityProfileArbitrary, (personality) => {
        const reminder = promptBuilder.buildContextReminder(personality);

        // Reminder should be reasonably concise (not too long)
        // Each dimension gets one line, plus header, so max ~10 lines
        const lines = reminder.split('\n').length;
        
        return lines <= 10 && lines >= 5; // At least 5 lines (header + 4 dimensions)
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain consistency with trait values', () => {
    fc.assert(
      fc.property(personalityProfileArbitrary, (personality) => {
        const reminder = promptBuilder.buildContextReminder(personality);

        // High civility should mention respectful/courteous
        if (personality.civility >= 8) {
          const hasHighCivilityReminder = /respectful|courteous/i.test(reminder);
          if (!hasHighCivilityReminder) return false;
        }

        // Low civility should mention challenging/aggressively
        if (personality.civility <= 2) {
          const hasLowCivilityReminder = /challenging|aggressively/i.test(reminder);
          if (!hasLowCivilityReminder) return false;
        }

        // High manner should mention formal/professional
        if (personality.manner >= 8) {
          const hasHighMannerReminder = /formal|professional/i.test(reminder);
          if (!hasHighMannerReminder) return false;
        }

        // Low manner should mention sharp/direct
        if (personality.manner <= 2) {
          const hasLowMannerReminder = /sharp|direct/i.test(reminder);
          if (!hasLowMannerReminder) return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
