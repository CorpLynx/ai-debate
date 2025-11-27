import * as fc from 'fast-check';
import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { Position } from '../../src/models/Position';
import { RoundType } from '../../src/models/RoundType';
import { Debate } from '../../src/models/Debate';
import { DebateState } from '../../src/models/DebateState';

describe('Context Construction Property Tests', () => {
  const orchestrator = new DebateOrchestratorImpl();

  // Helper to create a debate with some rounds
  const createDebateWithRounds = (topic: string, roundTypes: RoundType[]): Debate => {
    const affirmativeModel = new MockAIProvider('Model_A', { defaultResponse: 'Affirmative response' });
    const negativeModel = new MockAIProvider('Model_B', { defaultResponse: 'Negative response' });
    
    let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, affirmativeModel, negativeModel);
    
    // Add rounds as needed
    for (const roundType of roundTypes) {
      const round = {
        type: roundType,
        affirmativeStatement: {
          model: 'Model_A',
          position: Position.AFFIRMATIVE,
          content: `Affirmative ${roundType} statement`,
          wordCount: 3,
          generatedAt: new Date()
        },
        negativeStatement: {
          model: 'Model_B',
          position: Position.NEGATIVE,
          content: `Negative ${roundType} statement`,
          wordCount: 3,
          generatedAt: new Date()
        },
        timestamp: new Date()
      };
      debate = {
        ...debate,
        rounds: [...debate.rounds, round]
      };
    }
    
    return debate;
  };

  // Feature: ai-debate-system, Property 8: Context includes correct position indicator
  // Validates: Requirements 5.1, 5.2
  describe('Property 8: Context includes correct position indicator', () => {
    it('should include affirmative position indicator for affirmative model', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.constantFrom(...Object.values(RoundType)),
          (topic, roundType) => {
            const debate = createDebateWithRounds(topic, []);
            
            const context = orchestrator.buildContext(debate, Position.AFFIRMATIVE, roundType);
            
            // Context must indicate affirmative position
            expect(context.position).toBe(Position.AFFIRMATIVE);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include negative position indicator for negative model', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.constantFrom(...Object.values(RoundType)),
          (topic, roundType) => {
            const debate = createDebateWithRounds(topic, []);
            
            const context = orchestrator.buildContext(debate, Position.NEGATIVE, roundType);
            
            // Context must indicate negative position
            expect(context.position).toBe(Position.NEGATIVE);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always include the correct position regardless of round type', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.constantFrom(...Object.values(Position)),
          fc.constantFrom(...Object.values(RoundType)),
          (topic, position, roundType) => {
            const debate = createDebateWithRounds(topic, [RoundType.PREPARATION, RoundType.OPENING, RoundType.REBUTTAL]);
            
            const context = orchestrator.buildContext(debate, position, roundType);
            
            // Context position must match the requested position
            expect(context.position).toBe(position);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: ai-debate-system, Property 9: Rebuttal context includes opponent's opening
  // Validates: Requirements 5.3
  describe('Property 9: Rebuttal context includes opponent\'s opening', () => {
    it('should include opponent\'s opening statement in rebuttal context for affirmative', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1 }),
          (topic, opponentOpeningContent) => {
            // Create debate with opening round
            const debate = createDebateWithRounds(topic, [RoundType.OPENING]);
            // Update the negative opening statement content
            debate.rounds[0].negativeStatement!.content = opponentOpeningContent;
            
            // Build context for affirmative rebuttal
            const context = orchestrator.buildContext(debate, Position.AFFIRMATIVE, RoundType.REBUTTAL);
            
            // Context must include opponent's (negative) opening statement
            expect(context.previousStatements).toHaveLength(1);
            expect(context.previousStatements[0].position).toBe(Position.NEGATIVE);
            expect(context.previousStatements[0].content).toBe(opponentOpeningContent);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include opponent\'s opening statement in rebuttal context for negative', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1 }),
          (topic, opponentOpeningContent) => {
            // Create debate with opening round
            const debate = createDebateWithRounds(topic, [RoundType.OPENING]);
            // Update the affirmative opening statement content
            debate.rounds[0].affirmativeStatement!.content = opponentOpeningContent;
            
            // Build context for negative rebuttal
            const context = orchestrator.buildContext(debate, Position.NEGATIVE, RoundType.REBUTTAL);
            
            // Context must include opponent's (affirmative) opening statement
            expect(context.previousStatements).toHaveLength(1);
            expect(context.previousStatements[0].position).toBe(Position.AFFIRMATIVE);
            expect(context.previousStatements[0].content).toBe(opponentOpeningContent);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only include opponent\'s opening, not own opening', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (topic, affirmativeContent, negativeContent) => {
            // Create debate with opening round
            const debate = createDebateWithRounds(topic, [RoundType.OPENING]);
            debate.rounds[0].affirmativeStatement!.content = affirmativeContent;
            debate.rounds[0].negativeStatement!.content = negativeContent;
            
            // Build context for affirmative rebuttal
            const contextAff = orchestrator.buildContext(debate, Position.AFFIRMATIVE, RoundType.REBUTTAL);
            
            // Should only include negative's opening (opponent)
            expect(contextAff.previousStatements).toHaveLength(1);
            expect(contextAff.previousStatements[0].content).toBe(negativeContent);
            expect(contextAff.previousStatements[0].position).toBe(Position.NEGATIVE);
            
            // Build context for negative rebuttal
            const contextNeg = orchestrator.buildContext(debate, Position.NEGATIVE, RoundType.REBUTTAL);
            
            // Should only include affirmative's opening (opponent)
            expect(contextNeg.previousStatements).toHaveLength(1);
            expect(contextNeg.previousStatements[0].content).toBe(affirmativeContent);
            expect(contextNeg.previousStatements[0].position).toBe(Position.AFFIRMATIVE);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: ai-debate-system, Property 10: Closing context includes all previous statements
  // Validates: Requirements 5.4
  describe('Property 10: Closing context includes all previous statements', () => {
    it('should include all statements from opening, rebuttal, and cross-exam rounds', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          (topic, position) => {
            // Create debate with opening, rebuttal, and cross-exam rounds
            const debate = createDebateWithRounds(topic, [
              RoundType.OPENING,
              RoundType.REBUTTAL,
              RoundType.CROSS_EXAM
            ]);
            
            // Build context for closing statement
            const context = orchestrator.buildContext(debate, position, RoundType.CLOSING);
            
            // Context must include all 6 statements (2 per round × 3 rounds)
            expect(context.previousStatements).toHaveLength(6);
            
            // Verify statements are in correct order (affirmative first, then negative for each round)
            expect(context.previousStatements[0].position).toBe(Position.AFFIRMATIVE);
            expect(context.previousStatements[1].position).toBe(Position.NEGATIVE);
            expect(context.previousStatements[2].position).toBe(Position.AFFIRMATIVE);
            expect(context.previousStatements[3].position).toBe(Position.NEGATIVE);
            expect(context.previousStatements[4].position).toBe(Position.AFFIRMATIVE);
            expect(context.previousStatements[5].position).toBe(Position.NEGATIVE);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include statements from all completed rounds regardless of position', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          (topic) => {
            // Create debate with varying rounds
            const debate = createDebateWithRounds(topic, [
              RoundType.OPENING,
              RoundType.REBUTTAL
            ]);
            
            // Build context for affirmative closing
            const contextAff = orchestrator.buildContext(debate, Position.AFFIRMATIVE, RoundType.CLOSING);
            
            // Build context for negative closing
            const contextNeg = orchestrator.buildContext(debate, Position.NEGATIVE, RoundType.CLOSING);
            
            // Both should have the same previous statements (all statements from both positions)
            expect(contextAff.previousStatements).toHaveLength(4); // 2 rounds × 2 positions
            expect(contextNeg.previousStatements).toHaveLength(4);
            
            // Both contexts should contain the same statements
            expect(contextAff.previousStatements).toEqual(contextNeg.previousStatements);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not include preparation statements in closing context', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          (topic) => {
            // Create debate with preparation and other rounds
            const debate = createDebateWithRounds(topic, [
              RoundType.PREPARATION,
              RoundType.OPENING,
              RoundType.REBUTTAL
            ]);
            
            // Build context for closing
            const context = orchestrator.buildContext(debate, Position.AFFIRMATIVE, RoundType.CLOSING);
            
            // Should only include opening and rebuttal (not preparation)
            expect(context.previousStatements).toHaveLength(4); // 2 rounds × 2 positions
            
            // Verify no preparation statements are included
            const hasPreparation = context.previousStatements.some(
              stmt => stmt.content.includes('PREPARATION')
            );
            expect(hasPreparation).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain chronological order of statements', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          (topic) => {
            // Create debate with multiple rounds
            const debate = createDebateWithRounds(topic, [
              RoundType.OPENING,
              RoundType.REBUTTAL,
              RoundType.CROSS_EXAM
            ]);
            
            // Build context for closing
            const context = orchestrator.buildContext(debate, Position.AFFIRMATIVE, RoundType.CLOSING);
            
            // Verify statements contain round type indicators in order
            expect(context.previousStatements[0].content).toContain('opening');
            expect(context.previousStatements[1].content).toContain('opening');
            expect(context.previousStatements[2].content).toContain('rebuttal');
            expect(context.previousStatements[3].content).toContain('rebuttal');
            expect(context.previousStatements[4].content).toContain('cross_exam');
            expect(context.previousStatements[5].content).toContain('cross_exam');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: ai-debate-system, Property 12: Cross-examination context includes opening and rebuttal
  // Validates: Requirements 6.5
  describe('Property 12: Cross-examination context includes opening and rebuttal', () => {
    it('should include opponent\'s opening and rebuttal for affirmative cross-exam', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (topic, opponentOpening, opponentRebuttal) => {
            // Create debate with opening and rebuttal rounds
            const debate = createDebateWithRounds(topic, [RoundType.OPENING, RoundType.REBUTTAL]);
            
            // Set opponent (negative) statements
            debate.rounds[0].negativeStatement!.content = opponentOpening;
            debate.rounds[1].negativeStatement!.content = opponentRebuttal;
            
            // Build context for affirmative cross-exam
            const context = orchestrator.buildContext(debate, Position.AFFIRMATIVE, RoundType.CROSS_EXAM);
            
            // Context must include opponent's opening and rebuttal (2 statements)
            expect(context.previousStatements).toHaveLength(2);
            expect(context.previousStatements[0].position).toBe(Position.NEGATIVE);
            expect(context.previousStatements[0].content).toBe(opponentOpening);
            expect(context.previousStatements[1].position).toBe(Position.NEGATIVE);
            expect(context.previousStatements[1].content).toBe(opponentRebuttal);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include opponent\'s opening and rebuttal for negative cross-exam', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (topic, opponentOpening, opponentRebuttal) => {
            // Create debate with opening and rebuttal rounds
            const debate = createDebateWithRounds(topic, [RoundType.OPENING, RoundType.REBUTTAL]);
            
            // Set opponent (affirmative) statements
            debate.rounds[0].affirmativeStatement!.content = opponentOpening;
            debate.rounds[1].affirmativeStatement!.content = opponentRebuttal;
            
            // Build context for negative cross-exam
            const context = orchestrator.buildContext(debate, Position.NEGATIVE, RoundType.CROSS_EXAM);
            
            // Context must include opponent's opening and rebuttal (2 statements)
            expect(context.previousStatements).toHaveLength(2);
            expect(context.previousStatements[0].position).toBe(Position.AFFIRMATIVE);
            expect(context.previousStatements[0].content).toBe(opponentOpening);
            expect(context.previousStatements[1].position).toBe(Position.AFFIRMATIVE);
            expect(context.previousStatements[1].content).toBe(opponentRebuttal);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only include opponent statements, not own statements', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          (topic) => {
            // Create debate with opening and rebuttal rounds
            const debate = createDebateWithRounds(topic, [RoundType.OPENING, RoundType.REBUTTAL]);
            
            // Build context for affirmative cross-exam
            const contextAff = orchestrator.buildContext(debate, Position.AFFIRMATIVE, RoundType.CROSS_EXAM);
            
            // Should only include negative's statements
            expect(contextAff.previousStatements).toHaveLength(2);
            expect(contextAff.previousStatements.every(stmt => stmt.position === Position.NEGATIVE)).toBe(true);
            
            // Build context for negative cross-exam
            const contextNeg = orchestrator.buildContext(debate, Position.NEGATIVE, RoundType.CROSS_EXAM);
            
            // Should only include affirmative's statements
            expect(contextNeg.previousStatements).toHaveLength(2);
            expect(contextNeg.previousStatements.every(stmt => stmt.position === Position.AFFIRMATIVE)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include both opening and rebuttal, not just one', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          (topic) => {
            // Create debate with opening and rebuttal rounds
            const debate = createDebateWithRounds(topic, [RoundType.OPENING, RoundType.REBUTTAL]);
            
            // Build context for cross-exam
            const context = orchestrator.buildContext(debate, Position.AFFIRMATIVE, RoundType.CROSS_EXAM);
            
            // Must have exactly 2 statements (opening and rebuttal)
            expect(context.previousStatements).toHaveLength(2);
            
            // Verify one is from opening and one from rebuttal
            expect(context.previousStatements[0].content).toContain('opening');
            expect(context.previousStatements[1].content).toContain('rebuttal');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not include preparation statements', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          (topic) => {
            // Create debate with preparation, opening, and rebuttal rounds
            const debate = createDebateWithRounds(topic, [
              RoundType.PREPARATION,
              RoundType.OPENING,
              RoundType.REBUTTAL
            ]);
            
            // Build context for cross-exam
            const context = orchestrator.buildContext(debate, Position.AFFIRMATIVE, RoundType.CROSS_EXAM);
            
            // Should only include opening and rebuttal (not preparation)
            expect(context.previousStatements).toHaveLength(2);
            
            // Verify no preparation statements
            const hasPreparation = context.previousStatements.some(
              stmt => stmt.content.includes('preparation')
            );
            expect(hasPreparation).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
