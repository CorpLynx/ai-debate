import { TranscriptManagerImpl } from '../../src/transcript/TranscriptManager';
import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DebateConfig } from '../../src/models/DebateConfig';
import { RoundType } from '../../src/models/RoundType';

describe('TranscriptManager - showPreparation configuration', () => {
  let transcriptManager: TranscriptManagerImpl;
  let orchestrator: DebateOrchestratorImpl;
  let affirmativeModel: MockAIProvider;
  let negativeModel: MockAIProvider;

  beforeEach(() => {
    transcriptManager = new TranscriptManagerImpl('./test-transcripts');
    orchestrator = new DebateOrchestratorImpl('./test-transcripts');
    affirmativeModel = new MockAIProvider('TestModel-A');
    negativeModel = new MockAIProvider('TestModel-B');
  });

  it('should include preparation round when showPreparation is true', async () => {
    // Requirement 4.4: Display preparation summary when config.showPreparation is true
    const config: DebateConfig = {
      strictMode: false,
      showPreparation: true, // Enable preparation display
      numCrossExamQuestions: 3
    };

    let debate = orchestrator.initializeDebate(
      'Should AI be regulated?',
      config,
      affirmativeModel,
      negativeModel
    );

    // Execute preparation phase
    debate = await orchestrator.executePreparation(debate);

    // Generate transcript
    const transcript = transcriptManager.generateTranscript(debate);

    // Verify preparation round is included in formatted rounds
    const preparationRounds = transcript.formattedRounds.filter(
      round => round.roundType === RoundType.PREPARATION
    );

    expect(preparationRounds.length).toBe(1);
    expect(preparationRounds[0].affirmativeContent).toBeDefined();
    expect(preparationRounds[0].negativeContent).toBeDefined();
  });

  it('should exclude preparation round when showPreparation is false', async () => {
    // Requirement 4.4: Hide preparation summary when config.showPreparation is false
    const config: DebateConfig = {
      strictMode: false,
      showPreparation: false, // Disable preparation display
      numCrossExamQuestions: 3
    };

    let debate = orchestrator.initializeDebate(
      'Should AI be regulated?',
      config,
      affirmativeModel,
      negativeModel
    );

    // Execute preparation phase (it still happens internally)
    debate = await orchestrator.executePreparation(debate);

    // Generate transcript
    const transcript = transcriptManager.generateTranscript(debate);

    // Verify preparation round is NOT included in formatted rounds
    const preparationRounds = transcript.formattedRounds.filter(
      round => round.roundType === RoundType.PREPARATION
    );

    expect(preparationRounds.length).toBe(0);
  });

  it('should include other rounds regardless of showPreparation setting', async () => {
    // Verify that showPreparation only affects preparation round, not other rounds
    const config: DebateConfig = {
      strictMode: false,
      showPreparation: false, // Disable preparation display
      numCrossExamQuestions: 3
    };

    let debate = orchestrator.initializeDebate(
      'Should AI be regulated?',
      config,
      affirmativeModel,
      negativeModel
    );

    // Execute multiple rounds
    debate = await orchestrator.executePreparation(debate);
    debate = await orchestrator.executeOpeningStatements(debate);

    // Generate transcript
    const transcript = transcriptManager.generateTranscript(debate);

    // Verify preparation is excluded but opening is included
    const preparationRounds = transcript.formattedRounds.filter(
      round => round.roundType === RoundType.PREPARATION
    );
    const openingRounds = transcript.formattedRounds.filter(
      round => round.roundType === RoundType.OPENING
    );

    expect(preparationRounds.length).toBe(0);
    expect(openingRounds.length).toBe(1);
    expect(openingRounds[0].affirmativeContent).toBeDefined();
    expect(openingRounds[0].negativeContent).toBeDefined();
  });

  it('should still store preparation materials internally even when showPreparation is false', async () => {
    // Verify that preparation still happens and is stored in debate.rounds,
    // it's just not included in the transcript output
    const config: DebateConfig = {
      strictMode: false,
      showPreparation: false,
      numCrossExamQuestions: 3
    };

    let debate = orchestrator.initializeDebate(
      'Should AI be regulated?',
      config,
      affirmativeModel,
      negativeModel
    );

    // Execute preparation phase
    debate = await orchestrator.executePreparation(debate);

    // Verify preparation round exists in debate.rounds
    const preparationRound = debate.rounds.find(r => r.type === RoundType.PREPARATION);
    expect(preparationRound).toBeDefined();
    expect(preparationRound?.affirmativeStatement).toBeDefined();
    expect(preparationRound?.negativeStatement).toBeDefined();

    // But transcript should not include it
    const transcript = transcriptManager.generateTranscript(debate);
    const preparationInTranscript = transcript.formattedRounds.filter(
      round => round.roundType === RoundType.PREPARATION
    );
    expect(preparationInTranscript.length).toBe(0);
  });
});
