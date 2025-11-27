import { TranscriptManagerImpl } from '../../src/transcript/TranscriptManager';
import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DebateConfig } from '../../src/models/DebateConfig';
import { OutputFormat } from '../../src/models/Transcript';

describe('TranscriptManager - Enhanced Formatting', () => {
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

  describe('Text Format with Rich Formatting', () => {
    it('should include section headers in text format', async () => {
      // Requirement 4.1: Display transcript with clear section headers
      const config: DebateConfig = {
        strictMode: false,
        showPreparation: true,
        numCrossExamQuestions: 3
      };

      let debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      debate = await orchestrator.executePreparation(debate);
      const transcript = transcriptManager.generateTranscript(debate);
      const formatted = transcriptManager.formatTranscript(transcript, OutputFormat.TEXT);

      // Verify section headers are present
      expect(formatted).toContain('DEBATE TRANSCRIPT');
      expect(formatted).toContain('Preparation');
    });

    it('should include decorative borders in text format', async () => {
      // Requirement 4.2: Include decorative borders for text export
      const config: DebateConfig = {
        strictMode: false,
        showPreparation: true,
        numCrossExamQuestions: 3
      };

      let debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      debate = await orchestrator.executePreparation(debate);
      const transcript = transcriptManager.generateTranscript(debate);
      const formatted = transcriptManager.formatTranscript(transcript, OutputFormat.TEXT);

      // Verify decorative borders are present (box drawing characters)
      expect(formatted).toMatch(/[╔═╗╚]/);
    });

    it('should format summary statistics in a box', async () => {
      // Requirement 4.3: Present summary statistics in visually appealing format
      const config: DebateConfig = {
        strictMode: false,
        showPreparation: true,
        numCrossExamQuestions: 3
      };

      let debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      debate = await orchestrator.executePreparation(debate);
      const transcript = transcriptManager.generateTranscript(debate);
      const formatted = transcriptManager.formatTranscript(transcript, OutputFormat.TEXT);

      // Verify summary contains key information
      expect(formatted).toContain('Topic:');
      expect(formatted).toContain('Should AI be regulated?');
      expect(formatted).toContain('Participants:');
      expect(formatted).toContain('TestModel-A');
      expect(formatted).toContain('TestModel-B');
      expect(formatted).toContain('Duration:');
      expect(formatted).toContain('Rounds:');
    });

    it('should format timestamps consistently', async () => {
      // Requirement 4.4: Format timestamps in human-readable manner
      const config: DebateConfig = {
        strictMode: false,
        showPreparation: true,
        numCrossExamQuestions: 3
      };

      let debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      debate = await orchestrator.executePreparation(debate);
      const transcript = transcriptManager.generateTranscript(debate);
      const formatted = transcriptManager.formatTranscript(transcript, OutputFormat.TEXT);

      // Verify timestamp format (HH:MM:SS)
      expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should emphasize metrics visually', async () => {
      // Requirement 4.5: Present metrics with visual emphasis
      const config: DebateConfig = {
        strictMode: false,
        showPreparation: true,
        numCrossExamQuestions: 3
      };

      let debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      debate = await orchestrator.executePreparation(debate);
      const transcript = transcriptManager.generateTranscript(debate);
      const formatted = transcriptManager.formatTranscript(transcript, OutputFormat.TEXT);

      // Verify metrics are present with emphasis (ANSI codes or special characters)
      expect(formatted).toContain('Duration:');
      expect(formatted).toContain('Rounds:');
      // Check for ANSI color codes (indicating visual emphasis)
      expect(formatted).toMatch(/\x1b\[\d+m/);
    });
  });

  describe('Markdown Format with Enhanced Formatting', () => {
    it('should include section headers in markdown format', async () => {
      // Requirement 4.1: Display transcript with clear section headers
      const config: DebateConfig = {
        strictMode: false,
        showPreparation: true,
        numCrossExamQuestions: 3
      };

      let debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      debate = await orchestrator.executePreparation(debate);
      const transcript = transcriptManager.generateTranscript(debate);
      const formatted = transcriptManager.formatTranscript(transcript, OutputFormat.MARKDOWN);

      // Verify markdown headers are present
      expect(formatted).toContain('# 📜 Debate Transcript');
      expect(formatted).toContain('## 📊 Summary');
      expect(formatted).toContain('## 🎯 Preparation');
    });

    it('should format summary as a table in markdown', async () => {
      // Requirement 4.3: Present summary statistics in visually appealing format
      const config: DebateConfig = {
        strictMode: false,
        showPreparation: true,
        numCrossExamQuestions: 3
      };

      let debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      debate = await orchestrator.executePreparation(debate);
      const transcript = transcriptManager.generateTranscript(debate);
      const formatted = transcriptManager.formatTranscript(transcript, OutputFormat.MARKDOWN);

      // Verify markdown table is present
      expect(formatted).toContain('| Metric | Value |');
      expect(formatted).toContain('|--------|-------|');
      expect(formatted).toContain('| **Topic** |');
      expect(formatted).toContain('| **Duration** |');
    });

    it('should include round numbers and timestamps in markdown', async () => {
      // Requirement 4.4: Format timestamps in human-readable manner
      const config: DebateConfig = {
        strictMode: false,
        showPreparation: true,
        numCrossExamQuestions: 3
      };

      let debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      debate = await orchestrator.executePreparation(debate);
      const transcript = transcriptManager.generateTranscript(debate);
      const formatted = transcriptManager.formatTranscript(transcript, OutputFormat.MARKDOWN);

      // Verify round numbers and timestamps
      expect(formatted).toContain('(Round 1/1)');
      expect(formatted).toMatch(/\*Time: \d{2}:\d{2}:\d{2}\*/);
    });
  });

  describe('Bibliography Integration', () => {
    it('should include bibliography section when citations exist', async () => {
      const config: DebateConfig = {
        strictMode: false,
        showPreparation: true,
        numCrossExamQuestions: 3
      };

      let debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      debate = await orchestrator.executePreparation(debate);
      
      // Add mock citations
      const mockCitations = [
        { text: 'Smith, J. (2023). AI Ethics. Journal of Technology.', url: 'https://example.com/1' },
        { text: 'Doe, A. (2024). Machine Learning Regulation. Tech Review.', url: 'https://example.com/2' }
      ];
      transcriptManager.setCitations(mockCitations);
      
      const transcript = transcriptManager.generateTranscript(debate);
      const formatted = transcriptManager.formatTranscript(transcript, OutputFormat.TEXT);

      // Verify bibliography section is present
      expect(formatted).toContain('Bibliography');
      expect(formatted).toContain('Smith, J. (2023)');
      expect(formatted).toContain('Doe, A. (2024)');
    });

    it('should not include bibliography section when no citations exist', async () => {
      const config: DebateConfig = {
        strictMode: false,
        showPreparation: true,
        numCrossExamQuestions: 3
      };

      let debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      debate = await orchestrator.executePreparation(debate);
      
      // No citations set
      const transcript = transcriptManager.generateTranscript(debate);
      const formatted = transcriptManager.formatTranscript(transcript, OutputFormat.TEXT);

      // Verify bibliography section is not present
      expect(formatted).not.toContain('Bibliography');
    });
  });
});
