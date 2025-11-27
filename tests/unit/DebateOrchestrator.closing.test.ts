import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { RoundType } from '../../src/models/RoundType';
import { Position } from '../../src/models/Position';
import { DebateState } from '../../src/models/DebateState';

describe('DebateOrchestrator - Closing Statements Round', () => {
  let orchestrator: DebateOrchestratorImpl;
  let affirmativeModel: MockAIProvider;
  let negativeModel: MockAIProvider;

  beforeEach(() => {
    orchestrator = new DebateOrchestratorImpl();
    affirmativeModel = new MockAIProvider('TestModelA', { 
      defaultResponse: 'Affirmative closing statement' 
    });
    negativeModel = new MockAIProvider('TestModelB', { 
      defaultResponse: 'Negative closing statement' 
    });
  });

  describe('executeClosingStatements', () => {
    it('should generate and store closing statements for both models', async () => {
      // Initialize and progress through all rounds
      let debate = orchestrator.initializeDebate('Test Topic', DEFAULT_CONFIG, affirmativeModel, negativeModel);
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      debate = await orchestrator.executeRebuttals(debate);
      debate = await orchestrator.executeCrossExamination(debate);
      
      // Execute closing statements
      debate = await orchestrator.executeClosingStatements(debate);
      
      // Find the closing round
      const closingRound = debate.rounds.find(r => r.type === RoundType.CLOSING);
      
      expect(closingRound).toBeDefined();
      expect(closingRound?.affirmativeStatement).toBeDefined();
      expect(closingRound?.negativeStatement).toBeDefined();
      expect(closingRound?.affirmativeStatement?.content).toBe('Affirmative closing statement');
      expect(closingRound?.negativeStatement?.content).toBe('Negative closing statement');
    });

    it('should transition to CLOSING_STATEMENTS state', async () => {
      // Initialize and progress through all rounds
      let debate = orchestrator.initializeDebate('Test Topic', DEFAULT_CONFIG, affirmativeModel, negativeModel);
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      debate = await orchestrator.executeRebuttals(debate);
      debate = await orchestrator.executeCrossExamination(debate);
      
      // Execute closing statements
      debate = await orchestrator.executeClosingStatements(debate);
      
      // Verify debate is in CLOSING_STATEMENTS state
      expect(orchestrator.getCurrentState(debate)).toBe(DebateState.CLOSING_STATEMENTS);
    });

    it('should allow marking debate as completed after closing statements', async () => {
      // Initialize and progress through all rounds
      let debate = orchestrator.initializeDebate('Test Topic', DEFAULT_CONFIG, affirmativeModel, negativeModel);
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      debate = await orchestrator.executeRebuttals(debate);
      debate = await orchestrator.executeCrossExamination(debate);
      
      // Execute closing statements
      debate = await orchestrator.executeClosingStatements(debate);
      
      // Mark debate as completed (Requirement 3.1)
      debate = await orchestrator.completeDebate(debate);
      
      expect(orchestrator.getCurrentState(debate)).toBe(DebateState.COMPLETED);
      expect(debate.completedAt).toBeInstanceOf(Date);
    });

    it('should provide all previous statements as context', async () => {
      // Initialize and progress through all rounds
      let debate = orchestrator.initializeDebate('Test Topic', DEFAULT_CONFIG, affirmativeModel, negativeModel);
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      debate = await orchestrator.executeRebuttals(debate);
      debate = await orchestrator.executeCrossExamination(debate);
      
      // Verify context for affirmative closing includes all previous statements (Requirement 5.4)
      const affirmativeContext = orchestrator.buildContext(debate, Position.AFFIRMATIVE, RoundType.CLOSING);
      
      // Should include: opening (2), rebuttal (2), cross-exam (2) = 6 statements total
      expect(affirmativeContext.previousStatements.length).toBeGreaterThanOrEqual(6);
      
      // Verify context for negative closing includes all previous statements
      const negativeContext = orchestrator.buildContext(debate, Position.NEGATIVE, RoundType.CLOSING);
      expect(negativeContext.previousStatements.length).toBeGreaterThanOrEqual(6);
    });

    it('should throw error if called before cross-examination', async () => {
      let debate = orchestrator.initializeDebate('Test Topic', DEFAULT_CONFIG, affirmativeModel, negativeModel);
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      debate = await orchestrator.executeRebuttals(debate);
      
      // Try to execute closing statements without cross-examination
      await expect(orchestrator.executeClosingStatements(debate)).rejects.toThrow(/Invalid state transition/);
    });

    it('should store statements with correct metadata', async () => {
      let debate = orchestrator.initializeDebate('Test Topic', DEFAULT_CONFIG, affirmativeModel, negativeModel);
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      debate = await orchestrator.executeRebuttals(debate);
      debate = await orchestrator.executeCrossExamination(debate);
      
      debate = await orchestrator.executeClosingStatements(debate);
      
      const closingRound = debate.rounds.find(r => r.type === RoundType.CLOSING);
      
      // Check affirmative statement metadata
      expect(closingRound?.affirmativeStatement?.model).toBe('TestModelA');
      expect(closingRound?.affirmativeStatement?.position).toBe(Position.AFFIRMATIVE);
      expect(closingRound?.affirmativeStatement?.wordCount).toBeGreaterThan(0);
      expect(closingRound?.affirmativeStatement?.generatedAt).toBeInstanceOf(Date);
      
      // Check negative statement metadata
      expect(closingRound?.negativeStatement?.model).toBe('TestModelB');
      expect(closingRound?.negativeStatement?.position).toBe(Position.NEGATIVE);
      expect(closingRound?.negativeStatement?.wordCount).toBeGreaterThan(0);
      expect(closingRound?.negativeStatement?.generatedAt).toBeInstanceOf(Date);
    });
  });
});
