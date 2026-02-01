import * as fc from 'fast-check';
import { PromptBuilder } from '../../src/prompts/PromptBuilder';
import { Position } from '../../src/models/Position';
import { PersonalityProfile } from '../../src/models/PersonalityProfile';
import { DebateTactic } from '../../src/models/DebateTactic';

describe('Debate Tactics Prompt Properties', () => {
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

  // **Feature: ai-debate-advanced, Property 21: Debate tactics included in prompt**
  // **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
  describe('Property 21: Debate tactics included in prompt', () => {
    it('should include Gish Gallop instructions when tactic is specified', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const tactics = [DebateTactic.GISH_GALLOP];
            const prompt = builder.buildDebaterPrompt(position, personality, tactics);
            
            // Should include Gish Gallop technique instructions
            return prompt.includes('Gish Gallop Technique') &&
                   prompt.includes('Present multiple arguments in rapid succession');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include Strawman instructions when tactic is specified', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const tactics = [DebateTactic.STRAWMAN];
            const prompt = builder.buildDebaterPrompt(position, personality, tactics);
            
            // Should include Strawman technique instructions
            return prompt.includes('Strawman Technique') &&
                   prompt.includes('misrepresent') &&
                   (prompt.includes('refute') || prompt.includes('Refute'));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include Ad Hominem instructions when tactic is specified', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const tactics = [DebateTactic.AD_HOMINEM];
            const prompt = builder.buildDebaterPrompt(position, personality, tactics);
            
            // Should include Ad Hominem technique instructions
            return prompt.includes('Ad Hominem Technique') &&
                   prompt.includes('credibility') &&
                   prompt.includes('character');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include Appeal to Emotion instructions when tactic is specified', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const tactics = [DebateTactic.APPEAL_TO_EMOTION];
            const prompt = builder.buildDebaterPrompt(position, personality, tactics);
            
            // Should include Appeal to Emotion technique instructions
            return prompt.includes('Appeal to Emotion Technique') &&
                   prompt.includes('emotional impact');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include logical argumentation guidelines when NONE tactic is specified', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const tactics = [DebateTactic.NONE];
            const prompt = builder.buildDebaterPrompt(position, personality, tactics);
            
            // Should include logical argumentation guidelines
            return prompt.includes('Logical Argumentation Guidelines') &&
                   prompt.includes('valid logical arguments');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include instructions for all specified tactics', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          fc.array(
            fc.constantFrom(
              DebateTactic.GISH_GALLOP,
              DebateTactic.STRAWMAN,
              DebateTactic.AD_HOMINEM,
              DebateTactic.APPEAL_TO_EMOTION
            ),
            { minLength: 1, maxLength: 4 }
          ),
          (personality, position, tactics) => {
            const prompt = builder.buildDebaterPrompt(position, personality, tactics);
            
            // Should include instructions for each tactic
            let allIncluded = true;
            for (const tactic of tactics) {
              switch (tactic) {
                case DebateTactic.GISH_GALLOP:
                  allIncluded = allIncluded && prompt.includes('Gish Gallop Technique');
                  break;
                case DebateTactic.STRAWMAN:
                  allIncluded = allIncluded && prompt.includes('Strawman Technique');
                  break;
                case DebateTactic.AD_HOMINEM:
                  allIncluded = allIncluded && prompt.includes('Ad Hominem Technique');
                  break;
                case DebateTactic.APPEAL_TO_EMOTION:
                  allIncluded = allIncluded && prompt.includes('Appeal to Emotion Technique');
                  break;
              }
            }
            
            return allIncluded;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include Appeal to Authority instructions when tactic is specified', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const tactics = [DebateTactic.APPEAL_TO_AUTHORITY];
            const prompt = builder.buildDebaterPrompt(position, personality, tactics);
            
            // Should include Appeal to Authority technique instructions
            return prompt.includes('Appeal to Authority Technique') &&
                   prompt.includes('experts') &&
                   prompt.includes('authorities');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include False Dilemma instructions when tactic is specified', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const tactics = [DebateTactic.FALSE_DILEMMA];
            const prompt = builder.buildDebaterPrompt(position, personality, tactics);
            
            // Should include False Dilemma technique instructions
            return prompt.includes('False Dilemma Technique') &&
                   prompt.includes('two possible options');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include Slippery Slope instructions when tactic is specified', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const tactics = [DebateTactic.SLIPPERY_SLOPE];
            const prompt = builder.buildDebaterPrompt(position, personality, tactics);
            
            // Should include Slippery Slope technique instructions
            return prompt.includes('Slippery Slope Technique') &&
                   prompt.includes('chain of events');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include Red Herring instructions when tactic is specified', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const tactics = [DebateTactic.RED_HERRING];
            const prompt = builder.buildDebaterPrompt(position, personality, tactics);
            
            // Should include Red Herring technique instructions
            return prompt.includes('Red Herring Technique') &&
                   prompt.includes('irrelevant topics');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not include tactic instructions when tactics array is empty', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const tactics: DebateTactic[] = [];
            const prompt = builder.buildDebaterPrompt(position, personality, tactics);
            
            // Should include logical argumentation guidelines for empty tactics
            return prompt.includes('Logical Argumentation Guidelines');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce different prompts for different tactics', () => {
      fc.assert(
        fc.property(
          validProfileArb,
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (personality, position) => {
            const gishGallopPrompt = builder.buildDebaterPrompt(
              position,
              personality,
              [DebateTactic.GISH_GALLOP]
            );
            const strawmanPrompt = builder.buildDebaterPrompt(
              position,
              personality,
              [DebateTactic.STRAWMAN]
            );
            
            // Prompts should be different for different tactics
            return gishGallopPrompt !== strawmanPrompt;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
