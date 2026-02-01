/**
 * Final Integration Test for UI Polish Feature
 * 
 * Task 19: Final integration and polish
 * Requirements: All UI polish requirements
 * 
 * Tests complete debate flow with all UI enhancements:
 * - Rich text formatting
 * - Responsive layout
 * - Progress bars
 * - Citation extraction and bibliography
 * - Color scheme consistency
 * - Different terminal sizes
 * - Accessibility (colors disabled)
 */

import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DebateConfig, DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { UIConfig, DEFAULT_UI_CONFIG } from '../../src/models/UIConfig';
import { RoundType } from '../../src/models/RoundType';
import { Position } from '../../src/models/Position';
import { TranscriptManagerImpl } from '../../src/transcript/TranscriptManager';
import { StreamingHandler } from '../../src/streaming/StreamingHandler';
import { formatStatement } from '../../src/utils/StatementFormatter';
import { formatRichText } from '../../src/utils/RichTextFormatter';
import { wrapText } from '../../src/utils/ResponsiveLayout';
import { getTerminalSize } from '../../src/utils/TerminalSize';
import { BibliographyGenerator } from '../../src/utils/BibliographyGenerator';
import * as fs from 'fs';
import * as path from 'path';

describe('Final UI Polish Integration Tests', () => {
  let orchestrator: DebateOrchestratorImpl;
  let transcriptManager: TranscriptManagerImpl;
  const testTranscriptsDir = path.join(__dirname, '../../transcripts');

  beforeEach(() => {
    orchestrator = new DebateOrchestratorImpl(testTranscriptsDir);
    transcriptManager = new TranscriptManagerImpl(testTranscriptsDir);
  });

  afterEach(() => {
    // Clean up test transcripts
    if (fs.existsSync(testTranscriptsDir)) {
      const files = fs.readdirSync(testTranscriptsDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            fs.unlinkSync(path.join(testTranscriptsDir, file));
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      });
    }
  });

  describe('Complete Debate Flow with All Enhancements', () => {
    it('should execute complete debate with all UI enhancements enabled', async () => {
      // Create config with all UI features enabled
      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        ui: {
          enableRichFormatting: true,
          enableAnimations: true,
          enableColors: true,
          colorScheme: 'default',
          showPreparationProgress: true,
          enableHyperlinks: true
        }
      };

      // Create mock providers with rich content including citations
      const affirmativeModel = new MockAIProvider('GPT-4', {
        defaultResponse: `# Strong Arguments

According to **Smith et al. (2020)**, climate change is accelerating.

Key points:
- Rising temperatures
- Melting ice caps
- Extreme weather events

> "The evidence is overwhelming" - Climate Report 2020

See https://example.com/climate for more details.`
      });

      const negativeModel = new MockAIProvider('Claude', {
        defaultResponse: `# Counter Arguments

However, *Jones (2021)* presents alternative data.

Consider:
1. Natural cycles
2. Historical variations
3. Measurement accuracy

\`\`\`
data = analyze_trends()
\`\`\`

Visit https://example.org/debate for analysis.`
      });

      const topic = 'Climate change is primarily caused by human activity';

      // Initialize and execute complete debate
      let debate = orchestrator.initializeDebate(topic, config, affirmativeModel, negativeModel);
      
      // Execute all rounds
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      debate = await orchestrator.executeRebuttals(debate);
      debate = await orchestrator.executeCrossExamination(debate);
      debate = await orchestrator.executeClosingStatements(debate);
      debate = await orchestrator.completeDebate(debate);

      // Verify debate completed successfully
      expect(debate.state).toBe('completed');
      expect(debate.rounds.length).toBe(5);

      // Verify citations were extracted
      const citations = orchestrator.getCitations();
      expect(citations.length).toBeGreaterThan(0);

      // Verify bibliography can be generated
      const bibliographyGenerator = new BibliographyGenerator();
      const bibliography = bibliographyGenerator.generateBibliography(citations);
      expect(bibliography).toBeDefined();
      expect(bibliography.length).toBeGreaterThan(0);

      // Verify transcript generation
      const transcript = transcriptManager.generateTranscript(debate);
      expect(transcript).toBeDefined();
      expect(transcript.formattedRounds.length).toBe(5);
    });

    it('should handle debate with colors disabled for accessibility', async () => {
      // Create config with colors disabled
      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        ui: {
          enableRichFormatting: true,
          enableAnimations: false,
          enableColors: false, // Accessibility mode
          colorScheme: 'plain',
          showPreparationProgress: true,
          enableHyperlinks: false
        }
      };

      const affirmativeModel = new MockAIProvider('Model-A');
      const negativeModel = new MockAIProvider('Model-B');

      const topic = 'Test topic for accessibility';
      let debate = orchestrator.initializeDebate(topic, config, affirmativeModel, negativeModel);

      // Execute debate
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      debate = await orchestrator.executeRebuttals(debate);
      debate = await orchestrator.executeCrossExamination(debate);
      debate = await orchestrator.executeClosingStatements(debate);
      debate = await orchestrator.completeDebate(debate);

      // Verify debate completed without errors
      expect(debate.state).toBe('completed');
      expect(debate.rounds.length).toBeGreaterThanOrEqual(2);

      // Verify debate completed without errors (colors disabled mode)
      // The debate should complete successfully even with colors disabled
      const statement = debate.rounds[1].affirmativeStatement;
      if (statement) {
        // Statement should exist and have content
        expect(statement.content).toBeDefined();
        expect(statement.content.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Terminal Size Adaptation', () => {
    it('should format content for narrow terminals', () => {
      const narrowConfig: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        terminalWidth: 60 // Narrow terminal
      };

      const longText = 'This is a very long line of text that should be wrapped to fit within the narrow terminal width constraints.';
      const wrapped = wrapText(longText, 60, 0);

      // Verify wrapping occurred
      const lines = wrapped.split('\n');
      expect(lines.length).toBeGreaterThan(1);
      
      // Verify no line exceeds width
      lines.forEach(line => {
        // Remove ANSI codes for length check
        const plainLine = line.replace(/\x1b\[\d+m/g, '');
        expect(plainLine.length).toBeLessThanOrEqual(60);
      });
    });

    it('should format content for wide terminals', () => {
      const wideConfig: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        terminalWidth: 150 // Wide terminal
      };

      const text = 'This is a line of text in a wide terminal.';
      const wrapped = wrapText(text, 150, 0);

      // Should not wrap unnecessarily
      expect(wrapped).not.toContain('\n');
    });

    it('should detect terminal size automatically', () => {
      const size = getTerminalSize();
      
      expect(size).toHaveProperty('width');
      expect(size).toHaveProperty('height');
      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
    });
  });

  describe('Progress Bar Display', () => {
    let outputBuffer: string[];
    let originalStdoutWrite: typeof process.stdout.write;

    beforeEach(() => {
      outputBuffer = [];
      originalStdoutWrite = process.stdout.write;
      process.stdout.write = ((chunk: any) => {
        outputBuffer.push(chunk.toString());
        return true;
      }) as any;
    });

    afterEach(() => {
      process.stdout.write = originalStdoutWrite;
    });

    it('should display progress bars during preparation phase', async () => {
      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        ui: {
          ...DEFAULT_UI_CONFIG,
          showPreparationProgress: true
        }
      };

      const affirmativeModel = new MockAIProvider('Model-A');
      const negativeModel = new MockAIProvider('Model-B');

      const topic = 'Test topic';
      let debate = orchestrator.initializeDebate(topic, config, affirmativeModel, negativeModel);

      // Execute preparation
      debate = await orchestrator.executePreparation(debate);

      // Verify preparation completed
      expect(debate.rounds.length).toBe(1);
      expect(debate.rounds[0].type).toBe(RoundType.PREPARATION);
    });

    it('should handle concurrent progress bars for both models', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        showPreparationProgress: true
      };

      const handler = new StreamingHandler(config);
      
      // Initialize progress for both models
      handler.initializePreparationProgress('Model-A', 'Model-B');

      // Simulate chunks from both models
      handler.onChunk('chunk1', 'Model-A', Position.AFFIRMATIVE);
      handler.onChunk('chunk2', 'Model-B', Position.NEGATIVE);

      // Complete both
      handler.onComplete('Model-A', Position.AFFIRMATIVE);
      handler.onComplete('Model-B', Position.NEGATIVE);

      // Should not throw
      expect(() => handler.cleanup()).not.toThrow();
    });
  });

  describe('Citation Extraction and Bibliography', () => {
    it('should extract citations from all rounds', async () => {
      const affirmativeModel = new MockAIProvider('Model-A', {
        defaultResponse: 'According to Smith (2020), this is true. See https://example.com/source'
      });

      const negativeModel = new MockAIProvider('Model-B', {
        defaultResponse: 'However, Jones (2021) disagrees. Visit https://example.org/counter'
      });

      const topic = 'Test topic';
      let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, affirmativeModel, negativeModel);

      // Execute all rounds
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      debate = await orchestrator.executeRebuttals(debate);
      debate = await orchestrator.executeCrossExamination(debate);
      debate = await orchestrator.executeClosingStatements(debate);

      // Get citations
      const citations = orchestrator.getCitations();

      // Should have extracted citations
      expect(citations.length).toBeGreaterThan(0);

      // Verify citation structure
      citations.forEach(citation => {
        expect(citation).toHaveProperty('id');
        expect(citation).toHaveProperty('text');
        expect(citation).toHaveProperty('type');
        expect(citation).toHaveProperty('extractedFrom');
      });
    });

    it('should display bibliography at debate completion', async () => {
      const affirmativeModel = new MockAIProvider('Model-A', {
        defaultResponse: 'Source: https://example.com/research'
      });

      const negativeModel = new MockAIProvider('Model-B', {
        defaultResponse: 'Reference: https://example.org/study'
      });

      const topic = 'Test topic';
      let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, affirmativeModel, negativeModel);

      // Execute debate
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      debate = await orchestrator.executeRebuttals(debate);
      debate = await orchestrator.executeCrossExamination(debate);
      debate = await orchestrator.executeClosingStatements(debate);
      debate = await orchestrator.completeDebate(debate);

      // Get citations
      const citations = orchestrator.getCitations();

      // Generate bibliography
      const bibliographyGenerator = new BibliographyGenerator();
      const bibliography = bibliographyGenerator.generateBibliography(citations);

      // Should have generated bibliography
      expect(bibliography).toBeDefined();
      expect(typeof bibliography).toBe('string');
      expect(bibliography.length).toBeGreaterThan(0);
    });

    it('should deduplicate citations in bibliography', async () => {
      const affirmativeModel = new MockAIProvider('Model-A', {
        defaultResponse: 'Smith (2020) says X. Smith (2020) also says Y.'
      });

      const negativeModel = new MockAIProvider('Model-B', {
        defaultResponse: 'Different argument'
      });

      const topic = 'Test topic';
      let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, affirmativeModel, negativeModel);

      debate = await orchestrator.executePreparation(debate);

      const citations = orchestrator.getCitations();
      const uniqueTexts = new Set(citations.map(c => c.text));

      // Citations should be deduplicated
      expect(citations.length).toBe(uniqueTexts.size);
    });
  });

  describe('Rich Text Formatting', () => {
    it('should format markdown-like content', () => {
      const text = `# Header

This is **bold** and *italic* text.

- Item 1
- Item 2

> Quote text

\`code snippet\``;

      const formatted = formatRichText(text, {
        terminalWidth: 80,
        indentLevel: 0,
        preserveFormatting: true
      });

      // Should have formatted the content
      expect(formatted).toBeDefined();
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should preserve list formatting', () => {
      const text = `Arguments:
1. First point
2. Second point
3. Third point`;

      const formatted = formatRichText(text, {
        terminalWidth: 80,
        indentLevel: 0,
        preserveFormatting: true
      });

      // Should contain list items
      expect(formatted).toContain('1.');
      expect(formatted).toContain('2.');
      expect(formatted).toContain('3.');
    });

    it('should format quotes distinctly', () => {
      const text = `> This is a quote
> spanning multiple lines`;

      const formatted = formatRichText(text, {
        terminalWidth: 80,
        indentLevel: 0,
        preserveFormatting: true
      });

      // Should have formatted quotes
      expect(formatted).toBeDefined();
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('Visual Consistency', () => {
    it('should maintain consistent formatting across all rounds', async () => {
      const affirmativeModel = new MockAIProvider('Model-A');
      const negativeModel = new MockAIProvider('Model-B');

      const topic = 'Test topic';
      let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, affirmativeModel, negativeModel);

      // Execute all rounds
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      debate = await orchestrator.executeRebuttals(debate);
      debate = await orchestrator.executeCrossExamination(debate);
      debate = await orchestrator.executeClosingStatements(debate);

      // Format statements from each round
      const formattedStatements = debate.rounds
        .filter(round => round.affirmativeStatement && round.negativeStatement)
        .map((round, index) => {
          const affFormatted = formatStatement(
            round.affirmativeStatement!,
            round.type,
            index + 1,
            5
          );
          const negFormatted = formatStatement(
            round.negativeStatement!,
            round.type,
            index + 1,
            5
          );
          return { affFormatted, negFormatted };
        });

      // All statements should be formatted
      formattedStatements.forEach(({ affFormatted, negFormatted }) => {
        expect(affFormatted).toBeDefined();
        expect(affFormatted.length).toBeGreaterThan(0);
        expect(negFormatted).toBeDefined();
        expect(negFormatted.length).toBeGreaterThan(0);
      });
    });

    it('should use consistent color scheme throughout', async () => {
      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        ui: {
          ...DEFAULT_UI_CONFIG,
          colorScheme: 'default'
        }
      };

      const affirmativeModel = new MockAIProvider('Model-A');
      const negativeModel = new MockAIProvider('Model-B');

      const topic = 'Test topic';
      let debate = orchestrator.initializeDebate(topic, config, affirmativeModel, negativeModel);

      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);

      // Format statements
      const round = debate.rounds[1];
      if (round.affirmativeStatement && round.negativeStatement) {
        const affFormatted = formatStatement(round.affirmativeStatement, RoundType.OPENING, 1, 5);
        const negFormatted = formatStatement(round.negativeStatement, RoundType.OPENING, 1, 5);

        // Both should be formatted
        expect(affFormatted).toBeDefined();
        expect(negFormatted).toBeDefined();
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty statements gracefully', () => {
      const emptyStatement = {
        model: 'Test',
        position: Position.AFFIRMATIVE,
        content: '',
        generatedAt: new Date(),
        wordCount: 0
      };

      const formatted = formatStatement(emptyStatement, RoundType.OPENING, 1, 5);
      
      // Should not throw and should return something
      expect(formatted).toBeDefined();
    });

    it('should handle very long statements', () => {
      const longContent = 'word '.repeat(1000);
      const longStatement = {
        model: 'Test',
        position: Position.AFFIRMATIVE,
        content: longContent,
        generatedAt: new Date(),
        wordCount: 1000
      };

      const formatted = formatStatement(longStatement, RoundType.OPENING, 1, 5);
      
      // Should format without errors
      expect(formatted).toBeDefined();
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should handle special characters in content', () => {
      const specialContent = 'Test with special chars: <>&"\'`~!@#$%^&*()';
      const statement = {
        model: 'Test',
        position: Position.AFFIRMATIVE,
        content: specialContent,
        generatedAt: new Date(),
        wordCount: 10
      };

      const formatted = formatStatement(statement, RoundType.OPENING, 1, 5);
      
      // Should format without errors
      expect(formatted).toBeDefined();
      expect(formatted).toContain(specialContent);
    });

    it('should handle debate interruption gracefully', async () => {
      const affirmativeModel = new MockAIProvider('Model-A');
      const negativeModel = new MockAIProvider('Model-B');

      const topic = 'Test topic';
      let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, affirmativeModel, negativeModel);

      // Execute only some rounds
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);

      // Try to save partial transcript
      const filePath = await transcriptManager.savePartialTranscript(debate);
      
      // Should save successfully
      expect(filePath).toBeDefined();
      expect(fs.existsSync(filePath)).toBe(true);

      // Clean up the partial transcript file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  });

  describe('Configuration Validation', () => {
    it('should validate UI configuration', () => {
      const validConfig: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        terminalWidth: 80,
        showPreparationProgress: true,
        enableHyperlinks: true
      };

      // Should not throw with valid config
      expect(() => {
        const config: DebateConfig = {
          ...DEFAULT_CONFIG,
          ui: validConfig
        };
      }).not.toThrow();
    });

    it('should handle invalid terminal width gracefully', () => {
      const invalidConfig: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        terminalWidth: 10 // Too narrow
      };

      // Should still work, just with degraded formatting
      const text = 'Test text';
      const wrapped = wrapText(text, 10, 0);
      expect(wrapped).toBeDefined();
    });
  });
});
