import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { Position } from '../../src/models/Position';

describe('Citation System Integration', () => {
  let orchestrator: DebateOrchestratorImpl;
  let affirmativeModel: MockAIProvider;
  let negativeModel: MockAIProvider;

  beforeEach(() => {
    orchestrator = new DebateOrchestratorImpl();
    
    // Create mock models with responses containing citations
    affirmativeModel = new MockAIProvider('TestModel-Affirmative', {
      defaultResponse: 'According to Smith (2020), climate change is real. See https://example.com/climate for more info.'
    });
    
    negativeModel = new MockAIProvider('TestModel-Negative', {
      defaultResponse: 'However, Jones (2021) argues differently. Visit https://example.org/debate for details.'
    });
  });

  it('should extract citations from all debate rounds', async () => {
    // Initialize debate
    const debate = orchestrator.initializeDebate(
      'Climate change is primarily caused by human activity',
      DEFAULT_CONFIG,
      affirmativeModel,
      negativeModel
    );

    // Execute preparation phase
    const debateAfterPrep = await orchestrator.executePreparation(debate);

    // Execute opening statements
    const debateAfterOpening = await orchestrator.executeOpeningStatements(debateAfterPrep);

    // Get citations
    const citations = orchestrator.getCitations();

    // Should have extracted citations from both models in both rounds
    expect(citations.length).toBeGreaterThan(0);

    // Check that citations have proper structure
    citations.forEach(citation => {
      expect(citation).toHaveProperty('id');
      expect(citation).toHaveProperty('text');
      expect(citation).toHaveProperty('type');
      expect(citation).toHaveProperty('extractedFrom');
      expect(citation.extractedFrom).toHaveProperty('model');
      expect(citation.extractedFrom).toHaveProperty('position');
      expect(citation.extractedFrom).toHaveProperty('round');
    });

    // Check that we have citations from both positions
    const affirmativeCitations = citations.filter(c => c.extractedFrom.position === Position.AFFIRMATIVE);
    const negativeCitations = citations.filter(c => c.extractedFrom.position === Position.NEGATIVE);

    expect(affirmativeCitations.length).toBeGreaterThan(0);
    expect(negativeCitations.length).toBeGreaterThan(0);
  });

  it('should track citations throughout all debate rounds', async () => {
    // Initialize debate
    let debate = orchestrator.initializeDebate(
      'Climate change is primarily caused by human activity',
      DEFAULT_CONFIG,
      affirmativeModel,
      negativeModel
    );

    // Execute all rounds
    debate = await orchestrator.executePreparation(debate);
    debate = await orchestrator.executeOpeningStatements(debate);
    debate = await orchestrator.executeRebuttals(debate);
    debate = await orchestrator.executeCrossExamination(debate);
    debate = await orchestrator.executeClosingStatements(debate);

    // Complete debate
    debate = await orchestrator.completeDebate(debate);

    // Get all citations
    const citations = orchestrator.getCitations();

    // Should have citations from multiple rounds
    expect(citations.length).toBeGreaterThan(0);

    // Check that we have citations (even if from same round due to mock responses)
    // In real debates, citations would come from different rounds
    expect(citations.length).toBeGreaterThanOrEqual(2);
  });

  it('should deduplicate identical citations', async () => {
    // Create models that repeat the same citation
    const affirmativeWithDupes = new MockAIProvider('TestModel-Affirmative', {
      defaultResponse: 'According to Smith (2020), this is true. Smith (2020) also said...'
    });
    
    const negativeWithDupes = new MockAIProvider('TestModel-Negative', {
      defaultResponse: 'Jones (2021) disagrees. As Jones (2021) mentioned...'
    });

    // Initialize debate
    let debate = orchestrator.initializeDebate(
      'Test topic',
      DEFAULT_CONFIG,
      affirmativeWithDupes,
      negativeWithDupes
    );

    // Execute preparation
    debate = await orchestrator.executePreparation(debate);

    // Get citations
    const citations = orchestrator.getCitations();

    // Count unique citation texts
    const uniqueTexts = new Set(citations.map(c => c.text));

    // Should have deduplicated citations (each citation should appear only once)
    expect(citations.length).toBe(uniqueTexts.size);
  });

  it('should display bibliography without errors', async () => {
    // Initialize debate
    let debate = orchestrator.initializeDebate(
      'Climate change is primarily caused by human activity',
      DEFAULT_CONFIG,
      affirmativeModel,
      negativeModel
    );

    // Execute all rounds to reach completed state
    debate = await orchestrator.executePreparation(debate);
    debate = await orchestrator.executeOpeningStatements(debate);
    debate = await orchestrator.executeRebuttals(debate);
    debate = await orchestrator.executeCrossExamination(debate);
    debate = await orchestrator.executeClosingStatements(debate);

    // Complete debate
    debate = await orchestrator.completeDebate(debate);

    // Capture console output
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Display bibliography
    orchestrator.displayBibliography();

    // Should have called console.log (bibliography was displayed)
    expect(consoleSpy).toHaveBeenCalled();

    // Restore console
    consoleSpy.mockRestore();
  });

  it('should handle debates with no citations gracefully', async () => {
    // Create models with no citations
    const noCitationsAff = new MockAIProvider('TestModel-Affirmative', {
      defaultResponse: 'This is my argument without any citations.'
    });
    
    const noCitationsNeg = new MockAIProvider('TestModel-Negative', {
      defaultResponse: 'This is my counterargument also without citations.'
    });

    // Initialize debate
    let debate = orchestrator.initializeDebate(
      'Test topic',
      DEFAULT_CONFIG,
      noCitationsAff,
      noCitationsNeg
    );

    // Execute all rounds to reach completed state
    debate = await orchestrator.executePreparation(debate);
    debate = await orchestrator.executeOpeningStatements(debate);
    debate = await orchestrator.executeRebuttals(debate);
    debate = await orchestrator.executeCrossExamination(debate);
    debate = await orchestrator.executeClosingStatements(debate);

    // Complete debate
    debate = await orchestrator.completeDebate(debate);

    // Get citations
    const citations = orchestrator.getCitations();

    // Should have no citations
    expect(citations.length).toBe(0);

    // Display bibliography should not throw
    expect(() => orchestrator.displayBibliography()).not.toThrow();
  });

  it('should reset citation tracking for new debates', async () => {
    // First debate
    let debate1 = orchestrator.initializeDebate(
      'First topic',
      DEFAULT_CONFIG,
      affirmativeModel,
      negativeModel
    );
    debate1 = await orchestrator.executePreparation(debate1);

    const citations1 = orchestrator.getCitations();
    expect(citations1.length).toBeGreaterThan(0);

    // Second debate - should reset citations
    let debate2 = orchestrator.initializeDebate(
      'Second topic',
      DEFAULT_CONFIG,
      affirmativeModel,
      negativeModel
    );

    const citations2 = orchestrator.getCitations();
    
    // Citations should be reset (empty)
    expect(citations2.length).toBe(0);

    // Execute preparation for second debate
    debate2 = await orchestrator.executePreparation(debate2);

    const citations3 = orchestrator.getCitations();
    
    // Should have new citations from second debate
    expect(citations3.length).toBeGreaterThan(0);
  });
});
