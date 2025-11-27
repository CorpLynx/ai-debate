import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DebateConfig } from '../../src/models/DebateConfig';
import { DebateState } from '../../src/models/DebateState';

describe('DebateOrchestrator - Word Limit Enforcement', () => {
  let orchestrator: DebateOrchestratorImpl;
  let affirmativeModel: MockAIProvider;
  let negativeModel: MockAIProvider;

  beforeEach(() => {
    orchestrator = new DebateOrchestratorImpl();
    affirmativeModel = new MockAIProvider('TestModel-Affirmative');
    negativeModel = new MockAIProvider('TestModel-Negative');
  });

  it('should truncate statements that exceed the configured word limit', async () => {
    // Create a long response (100 words)
    const longResponse = Array(100).fill('word').join(' ');
    affirmativeModel.setDefaultResponse(longResponse);
    negativeModel.setDefaultResponse(longResponse);

    const config: DebateConfig = {
      wordLimit: 50, // Limit to 50 words
      strictMode: false,
      showPreparation: true,
      numCrossExamQuestions: 3
    };

    const debate = orchestrator.initializeDebate(
      'Test topic',
      config,
      affirmativeModel,
      negativeModel
    );

    // Execute preparation phase
    const updatedDebate = await orchestrator.executePreparation(debate);

    // Verify that statements were truncated
    const preparationRound = updatedDebate.rounds[0];
    expect(preparationRound.affirmativeStatement).toBeDefined();
    expect(preparationRound.negativeStatement).toBeDefined();

    // Count words in the truncated statements
    const affirmativeWords = preparationRound.affirmativeStatement!.content
      .split(/\s+/)
      .filter(w => w.length > 0 && w !== '...');
    const negativeWords = preparationRound.negativeStatement!.content
      .split(/\s+/)
      .filter(w => w.length > 0 && w !== '...');

    // Should be truncated to word limit (50 words + "...")
    expect(affirmativeWords.length).toBeLessThanOrEqual(50);
    expect(negativeWords.length).toBeLessThanOrEqual(50);
    
    // Should have the truncation indicator
    expect(preparationRound.affirmativeStatement!.content).toContain('...');
    expect(preparationRound.negativeStatement!.content).toContain('...');
  });

  it('should not modify statements within the word limit', async () => {
    const shortResponse = 'This is a short response with only ten words here.';
    affirmativeModel.setDefaultResponse(shortResponse);
    negativeModel.setDefaultResponse(shortResponse);

    const config: DebateConfig = {
      wordLimit: 50,
      strictMode: false,
      showPreparation: true,
      numCrossExamQuestions: 3
    };

    const debate = orchestrator.initializeDebate(
      'Test topic',
      config,
      affirmativeModel,
      negativeModel
    );

    const updatedDebate = await orchestrator.executePreparation(debate);

    // Verify that statements were NOT truncated
    const preparationRound = updatedDebate.rounds[0];
    expect(preparationRound.affirmativeStatement!.content).toBe(shortResponse);
    expect(preparationRound.negativeStatement!.content).toBe(shortResponse);
  });

  it('should not truncate when word limit is not configured', async () => {
    const longResponse = Array(100).fill('word').join(' ');
    affirmativeModel.setDefaultResponse(longResponse);
    negativeModel.setDefaultResponse(longResponse);

    const config: DebateConfig = {
      wordLimit: undefined, // No word limit
      strictMode: false,
      showPreparation: true,
      numCrossExamQuestions: 3
    };

    const debate = orchestrator.initializeDebate(
      'Test topic',
      config,
      affirmativeModel,
      negativeModel
    );

    const updatedDebate = await orchestrator.executePreparation(debate);

    // Verify that statements were NOT truncated
    const preparationRound = updatedDebate.rounds[0];
    expect(preparationRound.affirmativeStatement!.content).toBe(longResponse);
    expect(preparationRound.negativeStatement!.content).toBe(longResponse);
  });

  it('should enforce word limit across all debate rounds', async () => {
    const longResponse = Array(100).fill('word').join(' ');
    affirmativeModel.setDefaultResponse(longResponse);
    negativeModel.setDefaultResponse(longResponse);

    const config: DebateConfig = {
      wordLimit: 30,
      strictMode: false,
      showPreparation: true,
      numCrossExamQuestions: 3
    };

    const debate = orchestrator.initializeDebate(
      'Test topic',
      config,
      affirmativeModel,
      negativeModel
    );

    // Execute preparation
    let updatedDebate = await orchestrator.executePreparation(debate);
    
    // Execute opening statements
    updatedDebate = await orchestrator.executeOpeningStatements(updatedDebate);

    // Check both rounds
    const preparationRound = updatedDebate.rounds[0];
    const openingRound = updatedDebate.rounds[1];

    // All statements should be truncated
    expect(preparationRound.affirmativeStatement!.content).toContain('...');
    expect(preparationRound.negativeStatement!.content).toContain('...');
    expect(openingRound.affirmativeStatement!.content).toContain('...');
    expect(openingRound.negativeStatement!.content).toContain('...');

    // All should be within word limit
    const checkWordCount = (content: string) => {
      const words = content.split(/\s+/).filter(w => w.length > 0 && w !== '...');
      return words.length <= 30;
    };

    expect(checkWordCount(preparationRound.affirmativeStatement!.content)).toBe(true);
    expect(checkWordCount(preparationRound.negativeStatement!.content)).toBe(true);
    expect(checkWordCount(openingRound.affirmativeStatement!.content)).toBe(true);
    expect(checkWordCount(openingRound.negativeStatement!.content)).toBe(true);
  });
});
