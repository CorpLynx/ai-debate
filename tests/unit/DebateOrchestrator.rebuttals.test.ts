import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { RoundType } from '../../src/models/RoundType';
import { Position } from '../../src/models/Position';

describe('DebateOrchestrator - Rebuttals Round', () => {
  let orchestrator: DebateOrchestratorImpl;
  let affirmativeModel: MockAIProvider;
  let negativeModel: MockAIProvider;

  beforeEach(() => {
    orchestrator = new DebateOrchestratorImpl();
    affirmativeModel = new MockAIProvider('TestModelA', { 
      defaultResponse: 'Affirmative rebuttal response' 
    });
    negativeModel = new MockAIProvider('TestModelB', { 
      defaultResponse: 'Negative rebuttal response' 
    });
  });

  describe('executeRebuttals', () => {
    it('should generate and store rebuttal statements for both models', async () => {
      // Initialize and progress to opening statements
      let debate = orchestrator.initializeDebate('Test Topic', DEFAULT_CONFIG, affirmativeModel, negativeModel);
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      
      // Execute rebuttals
      debate = await orchestrator.executeRebuttals(debate);
      
      // Find the rebuttal round
      const rebuttalRound = debate.rounds.find(r => r.type === RoundType.REBUTTAL);
      
      expect(rebuttalRound).toBeDefined();
      expect(rebuttalRound?.affirmativeStatement).toBeDefined();
      expect(rebuttalRound?.negativeStatement).toBeDefined();
      expect(rebuttalRound?.affirmativeStatement?.content).toBe('Affirmative rebuttal response');
      expect(rebuttalRound?.negativeStatement?.content).toBe('Negative rebuttal response');
    });

    it('should verify context includes opponent opening statement via buildContext', async () => {
      // Initialize and progress through debate
      let debate = orchestrator.initializeDebate('Test Topic', DEFAULT_CONFIG, affirmativeModel, negativeModel);
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      
      // Verify context for affirmative rebuttal includes negative's opening
      const affirmativeContext = orchestrator.buildContext(debate, Position.AFFIRMATIVE, RoundType.REBUTTAL);
      expect(affirmativeContext.previousStatements).toHaveLength(1);
      expect(affirmativeContext.previousStatements[0].position).toBe(Position.NEGATIVE);
      
      // Verify context for negative rebuttal includes affirmative's opening
      const negativeContext = orchestrator.buildContext(debate, Position.NEGATIVE, RoundType.REBUTTAL);
      expect(negativeContext.previousStatements).toHaveLength(1);
      expect(negativeContext.previousStatements[0].position).toBe(Position.AFFIRMATIVE);
    });

    it('should transition debate state to REBUTTALS', async () => {
      let debate = orchestrator.initializeDebate('Test Topic', DEFAULT_CONFIG, affirmativeModel, negativeModel);
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      
      debate = await orchestrator.executeRebuttals(debate);
      
      expect(orchestrator.getCurrentState(debate)).toBe('rebuttals');
    });

    it('should throw error if called before opening statements', async () => {
      let debate = orchestrator.initializeDebate('Test Topic', DEFAULT_CONFIG, affirmativeModel, negativeModel);
      debate = await orchestrator.executePreparation(debate);
      
      // Try to execute rebuttals without opening statements
      await expect(orchestrator.executeRebuttals(debate)).rejects.toThrow(/Invalid state transition/);
    });

    it('should store statements with correct metadata', async () => {
      let debate = orchestrator.initializeDebate('Test Topic', DEFAULT_CONFIG, affirmativeModel, negativeModel);
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      
      debate = await orchestrator.executeRebuttals(debate);
      
      const rebuttalRound = debate.rounds.find(r => r.type === RoundType.REBUTTAL);
      
      // Check affirmative statement metadata
      expect(rebuttalRound?.affirmativeStatement?.model).toBe('TestModelA');
      expect(rebuttalRound?.affirmativeStatement?.position).toBe(Position.AFFIRMATIVE);
      expect(rebuttalRound?.affirmativeStatement?.wordCount).toBeGreaterThan(0);
      expect(rebuttalRound?.affirmativeStatement?.generatedAt).toBeInstanceOf(Date);
      
      // Check negative statement metadata
      expect(rebuttalRound?.negativeStatement?.model).toBe('TestModelB');
      expect(rebuttalRound?.negativeStatement?.position).toBe(Position.NEGATIVE);
      expect(rebuttalRound?.negativeStatement?.wordCount).toBeGreaterThan(0);
      expect(rebuttalRound?.negativeStatement?.generatedAt).toBeInstanceOf(Date);
    });
  });
});
