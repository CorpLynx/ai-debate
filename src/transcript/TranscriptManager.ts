import { Debate } from '../models/Debate';
import { Transcript, TranscriptSummary, FormattedRound, OutputFormat } from '../models/Transcript';
import { promises as fs } from 'fs';
import * as path from 'path';
import { RichTextFormatter } from '../utils/RichTextFormatter';
import { ResponsiveLayout, BoxOptions } from '../utils/ResponsiveLayout';
import { DEFAULT_COLOR_SCHEME, ANSI_RESET } from '../models/ColorScheme';
import { BoxStyle } from '../models/FormattingRules';

export interface TranscriptManager {
  generateTranscript(debate: Debate): Transcript;
  formatTranscript(transcript: Transcript, format: OutputFormat): string;
  saveTranscript(transcript: Transcript): Promise<string>;
  loadTranscript(id: string): Promise<Transcript>;
}

export class TranscriptManagerImpl implements TranscriptManager {
  private transcriptsDir: string;
  private citations: any[] = []; // Will be set by orchestrator
  private richTextFormatter: RichTextFormatter;
  private layout: ResponsiveLayout;

  constructor(transcriptsDir: string = './transcripts') {
    this.transcriptsDir = transcriptsDir;
    this.richTextFormatter = new RichTextFormatter();
    this.layout = new ResponsiveLayout();
  }

  /**
   * Sets the citations to be included in the transcript
   */
  setCitations(citations: any[]): void {
    this.citations = citations;
  }

  /**
   * Generates a complete transcript from a debate
   * Collects all statements in chronological order
   * Includes debate topic, models, positions, preparation materials (if showPreparation is true), and all statements
   * Ensures no statements are missing or duplicated
   * 
   * Requirements:
   * - 4.4: Conditionally display preparation summary based on config
   */
  generateTranscript(debate: Debate): Transcript {
    // Collect all statements in chronological order
    const formattedRounds: FormattedRound[] = [];
    
    for (const round of debate.rounds) {
      // Requirement 4.4: Skip preparation round if showPreparation is false
      if (round.type === 'preparation' && !debate.config.showPreparation) {
        continue;
      }
      
      const formattedRound: FormattedRound = {
        roundType: round.type,
        timestamp: round.timestamp
      };
      
      // Add affirmative statement if present
      if (round.affirmativeStatement) {
        formattedRound.affirmativeContent = round.affirmativeStatement.content;
      }
      
      // Add negative statement if present
      if (round.negativeStatement) {
        formattedRound.negativeContent = round.negativeStatement.content;
      }
      
      formattedRounds.push(formattedRound);
    }
    
    // Calculate total duration
    const totalDuration = debate.completedAt && debate.createdAt
      ? (debate.completedAt.getTime() - debate.createdAt.getTime()) / 1000
      : 0;
    
    // Create summary with all required metadata
    const summary: TranscriptSummary = {
      topic: debate.topic,
      models: {
        affirmative: debate.affirmativeModel.getModelName(),
        negative: debate.negativeModel.getModelName()
      },
      totalDuration,
      roundCount: debate.rounds.length
    };
    
    return {
      debate,
      formattedRounds,
      summary,
      citations: this.citations.length > 0 ? this.citations : undefined
    };
  }

  /**
   * Formats a transcript in the specified output format
   * Supports plain text, markdown, and JSON formats
   * Preserves all information including metadata, statements, and attribution
   * 
   * Requirements:
   * - 8.3: Display or export the complete Debate Transcript
   * - 8.4: Preserve formatting and attribution for each statement
   */
  formatTranscript(transcript: Transcript, format: OutputFormat): string {
    switch (format) {
      case OutputFormat.TEXT:
        return this.formatAsText(transcript);
      case OutputFormat.MARKDOWN:
        return this.formatAsMarkdown(transcript);
      case OutputFormat.JSON:
        return this.formatAsJSON(transcript);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Formats transcript as plain text with rich formatting
   * 
   * Requirements:
   * - 4.1: Display transcript with clear section headers
   * - 4.2: Include decorative borders for text export
   * - 4.3: Present summary statistics in visually appealing format
   * - 4.4: Format timestamps in human-readable manner
   * - 4.5: Present metrics with visual emphasis
   */
  private formatAsText(transcript: Transcript): string {
    const lines: string[] = [];
    const terminalSize = this.layout.getTerminalSize();
    const boxWidth = Math.min(100, terminalSize.width - 4);
    
    // Requirement 4.2: Decorative borders for text export
    const topBorder = '╔' + '═'.repeat(boxWidth - 2) + '╗';
    const bottomBorder = '╚' + '═'.repeat(boxWidth - 2) + '╝';
    const separator = '─'.repeat(boxWidth);
    
    // Header with decorative border
    lines.push(topBorder);
    const title = 'DEBATE TRANSCRIPT';
    const titlePadding = Math.floor((boxWidth - 2 - title.length) / 2);
    lines.push('║' + ' '.repeat(titlePadding) + 
               `${DEFAULT_COLOR_SCHEME.bold}${title}${ANSI_RESET}` + 
               ' '.repeat(boxWidth - 2 - titlePadding - title.length) + '║');
    lines.push(bottomBorder);
    lines.push('');
    
    // Requirement 4.3: Summary statistics in visually appealing format
    lines.push(this.formatSummaryStatistics(transcript.summary, boxWidth));
    lines.push('');
    lines.push(separator);
    lines.push('');
    
    // Requirement 4.1: Clear section headers for each round
    for (let i = 0; i < transcript.formattedRounds.length; i++) {
      const round = transcript.formattedRounds[i];
      
      // Section header with visual prominence
      const sectionHeader = this.formatSectionHeader(
        round.roundType, 
        i + 1, 
        transcript.formattedRounds.length,
        round.timestamp
      );
      lines.push(sectionHeader);
      lines.push('');
      
      if (round.affirmativeContent) {
        const affirmativeLabel = `${DEFAULT_COLOR_SCHEME.affirmative}▸ Affirmative${ANSI_RESET} ${DEFAULT_COLOR_SCHEME.muted}(${transcript.summary.models.affirmative})${ANSI_RESET}`;
        lines.push(affirmativeLabel);
        lines.push('');
        
        // Format content with rich text
        const formattedContent = this.richTextFormatter.formatRichText(round.affirmativeContent, {
          terminalWidth: boxWidth,
          indentLevel: 1
        });
        lines.push(formattedContent);
        lines.push('');
      }
      
      if (round.negativeContent) {
        const negativeLabel = `${DEFAULT_COLOR_SCHEME.negative}▸ Negative${ANSI_RESET} ${DEFAULT_COLOR_SCHEME.muted}(${transcript.summary.models.negative})${ANSI_RESET}`;
        lines.push(negativeLabel);
        lines.push('');
        
        // Format content with rich text
        const formattedContent = this.richTextFormatter.formatRichText(round.negativeContent, {
          terminalWidth: boxWidth,
          indentLevel: 1
        });
        lines.push(formattedContent);
        lines.push('');
      }
      
      // Add separator between rounds
      if (i < transcript.formattedRounds.length - 1) {
        lines.push(separator);
        lines.push('');
      }
    }
    
    // Add bibliography if citations exist
    if (transcript.citations && transcript.citations.length > 0) {
      lines.push('');
      lines.push(separator);
      lines.push('');
      lines.push(this.formatBibliographySection(transcript.citations));
    }
    
    return lines.join('\n');
  }

  /**
   * Formats summary statistics in a visually appealing table format
   * Requirement 4.3: Present summary statistics in visually appealing format
   * Requirement 4.5: Present metrics with visual emphasis
   */
  private formatSummaryStatistics(summary: TranscriptSummary, width: number): string {
    const lines: string[] = [];
    
    // Create a box for summary
    const boxOptions: BoxOptions = {
      title: 'Summary',
      padding: 1,
      style: BoxStyle.ROUNDED,
      color: DEFAULT_COLOR_SCHEME.info,
      width: Math.min(80, width)
    };
    
    // Format metrics with visual emphasis
    const content = [
      `${DEFAULT_COLOR_SCHEME.bold}Topic:${ANSI_RESET} ${summary.topic}`,
      '',
      `${DEFAULT_COLOR_SCHEME.bold}Participants:${ANSI_RESET}`,
      `  ${DEFAULT_COLOR_SCHEME.affirmative}● Affirmative:${ANSI_RESET} ${summary.models.affirmative}`,
      `  ${DEFAULT_COLOR_SCHEME.negative}● Negative:${ANSI_RESET} ${summary.models.negative}`,
      '',
      `${DEFAULT_COLOR_SCHEME.bold}Statistics:${ANSI_RESET}`,
      `  ${DEFAULT_COLOR_SCHEME.accent}⏱${ANSI_RESET}  Duration: ${this.formatDuration(summary.totalDuration)}`,
      `  ${DEFAULT_COLOR_SCHEME.accent}🔄${ANSI_RESET} Rounds: ${summary.roundCount}`
    ].join('\n');
    
    return this.layout.createResponsiveBox(content, boxOptions);
  }

  /**
   * Formats a section header with visual prominence
   * Requirement 4.1: Display transcript with clear section headers
   * Requirement 4.4: Format timestamps in human-readable manner
   */
  private formatSectionHeader(roundType: string, roundNumber: number, totalRounds: number, timestamp: Date): string {
    const formattedRoundType = this.capitalizeRoundType(roundType);
    const formattedTimestamp = this.formatTimestamp(timestamp);
    
    // Create prominent header
    const headerText = `${DEFAULT_COLOR_SCHEME.accent}▸▸▸${ANSI_RESET} ${DEFAULT_COLOR_SCHEME.bold}${formattedRoundType}${ANSI_RESET} ${DEFAULT_COLOR_SCHEME.muted}(Round ${roundNumber}/${totalRounds})${ANSI_RESET}`;
    const timestampText = `${DEFAULT_COLOR_SCHEME.muted}${formattedTimestamp}${ANSI_RESET}`;
    
    return `${headerText}  ${timestampText}`;
  }

  /**
   * Formats a timestamp in a human-readable and consistent manner
   * Requirement 4.4: Format timestamps in human-readable manner
   */
  private formatTimestamp(timestamp: Date): string {
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    const seconds = timestamp.getSeconds().toString().padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Formats duration with visual emphasis
   * Requirement 4.5: Present metrics with visual emphasis
   */
  private formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${DEFAULT_COLOR_SCHEME.success}${seconds.toFixed(1)}s${ANSI_RESET}`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${DEFAULT_COLOR_SCHEME.success}${minutes}m ${remainingSeconds}s${ANSI_RESET}`;
  }

  /**
   * Formats the bibliography section
   */
  private formatBibliographySection(citations: any[]): string {
    const lines: string[] = [];
    
    lines.push(`${DEFAULT_COLOR_SCHEME.bold}${DEFAULT_COLOR_SCHEME.accent}Bibliography${ANSI_RESET}`);
    lines.push('');
    
    for (let i = 0; i < citations.length; i++) {
      const citation = citations[i];
      const number = `${DEFAULT_COLOR_SCHEME.muted}[${i + 1}]${ANSI_RESET}`;
      lines.push(`${number} ${citation.text || citation.url || 'Unknown source'}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Formats transcript as markdown with enhanced formatting
   * 
   * Requirements:
   * - 4.1: Display transcript with clear section headers
   * - 4.3: Present summary statistics in visually appealing format
   * - 4.4: Format timestamps in human-readable manner
   * - 4.5: Present metrics with visual emphasis
   */
  private formatAsMarkdown(transcript: Transcript): string {
    const lines: string[] = [];
    
    // Header with decorative elements
    lines.push('# 📜 Debate Transcript');
    lines.push('');
    lines.push('---');
    lines.push('');
    
    // Summary with enhanced formatting
    lines.push('## 📊 Summary');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| **Topic** | ${transcript.summary.topic} |`);
    lines.push(`| **Affirmative** | ${transcript.summary.models.affirmative} |`);
    lines.push(`| **Negative** | ${transcript.summary.models.negative} |`);
    lines.push(`| **Duration** | ${this.formatDurationPlain(transcript.summary.totalDuration)} |`);
    lines.push(`| **Rounds** | ${transcript.summary.roundCount} |`);
    lines.push('');
    lines.push('---');
    lines.push('');
    
    // Rounds with section headers
    for (let i = 0; i < transcript.formattedRounds.length; i++) {
      const round = transcript.formattedRounds[i];
      const formattedRoundType = this.capitalizeRoundType(round.roundType);
      const formattedTimestamp = this.formatTimestamp(round.timestamp);
      
      // Section header with round number and timestamp
      lines.push(`## 🎯 ${formattedRoundType} (Round ${i + 1}/${transcript.formattedRounds.length})`);
      lines.push('');
      lines.push(`*Time: ${formattedTimestamp}*`);
      lines.push('');
      
      if (round.affirmativeContent) {
        lines.push(`### 🔵 Affirmative (${transcript.summary.models.affirmative})`);
        lines.push('');
        lines.push(round.affirmativeContent);
        lines.push('');
      }
      
      if (round.negativeContent) {
        lines.push(`### 🔴 Negative (${transcript.summary.models.negative})`);
        lines.push('');
        lines.push(round.negativeContent);
        lines.push('');
      }
      
      if (i < transcript.formattedRounds.length - 1) {
        lines.push('---');
        lines.push('');
      }
    }
    
    // Add bibliography if citations exist
    if (transcript.citations && transcript.citations.length > 0) {
      lines.push('');
      lines.push('---');
      lines.push('');
      lines.push('## 📚 Bibliography');
      lines.push('');
      
      for (let i = 0; i < transcript.citations.length; i++) {
        const citation = transcript.citations[i];
        lines.push(`${i + 1}. ${citation.text || citation.url || 'Unknown source'}`);
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Formats duration without ANSI codes (for markdown/JSON)
   */
  private formatDurationPlain(seconds: number): string {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }

  /**
   * Formats transcript as JSON
   */
  private formatAsJSON(transcript: Transcript): string {
    const serializable = this.serializeTranscript(transcript);
    return JSON.stringify(serializable, null, 2);
  }

  /**
   * Capitalizes and formats round type for display
   */
  private capitalizeRoundType(roundType: string): string {
    return roundType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Saves a transcript to the file system
   * Preserves formatting and attribution
   * Returns the file path where the transcript was saved
   */
  async saveTranscript(transcript: Transcript): Promise<string> {
    // Ensure transcripts directory exists
    await fs.mkdir(this.transcriptsDir, { recursive: true });

    // Create a serializable version of the transcript
    const serializable = this.serializeTranscript(transcript);

    // Generate file path using debate ID
    const fileName = `${transcript.debate.id}.json`;
    const filePath = path.join(this.transcriptsDir, fileName);

    // Write to file with pretty formatting
    await fs.writeFile(filePath, JSON.stringify(serializable, null, 2), 'utf-8');

    return filePath;
  }

  /**
   * Saves a partial transcript when a critical error occurs
   * Generates a transcript from the current debate state (even if incomplete)
   * and saves it with a special marker indicating it's partial
   * 
   * @param debate - The debate in its current state
   * @returns The file path where the partial transcript was saved
   */
  async savePartialTranscript(debate: Debate): Promise<string> {
    // Generate transcript from current state
    const transcript = this.generateTranscript(debate);
    
    // Ensure transcripts directory exists
    await fs.mkdir(this.transcriptsDir, { recursive: true });

    // Create a serializable version with partial marker
    const serializable = {
      ...this.serializeTranscript(transcript),
      partial: true,
      errors: debate.errors || []
    };

    // Generate file path with 'partial' prefix
    const fileName = `partial-${transcript.debate.id}.json`;
    const filePath = path.join(this.transcriptsDir, fileName);

    // Write to file with pretty formatting
    await fs.writeFile(filePath, JSON.stringify(serializable, null, 2), 'utf-8');

    return filePath;
  }

  /**
   * Loads a transcript from the file system
   * Restores formatting and attribution
   */
  async loadTranscript(id: string): Promise<Transcript> {
    const fileName = `${id}.json`;
    const filePath = path.join(this.transcriptsDir, fileName);

    // Read file
    const content = await fs.readFile(filePath, 'utf-8');
    const serialized = JSON.parse(content);

    // Deserialize back to Transcript
    return this.deserializeTranscript(serialized);
  }

  /**
   * Converts a Transcript to a serializable format
   * Handles AIModelProvider instances which can't be directly serialized
   */
  private serializeTranscript(transcript: Transcript): any {
    return {
      debate: {
        id: transcript.debate.id,
        topic: transcript.debate.topic,
        config: transcript.debate.config,
        affirmativeModelName: transcript.debate.affirmativeModel.getModelName(),
        negativeModelName: transcript.debate.negativeModel.getModelName(),
        state: transcript.debate.state,
        rounds: transcript.debate.rounds.map(round => ({
          type: round.type,
          affirmativeStatement: round.affirmativeStatement,
          negativeStatement: round.negativeStatement,
          timestamp: round.timestamp.toISOString()
        })),
        createdAt: transcript.debate.createdAt.toISOString(),
        completedAt: transcript.debate.completedAt?.toISOString()
      },
      formattedRounds: transcript.formattedRounds.map(round => ({
        roundType: round.roundType,
        affirmativeContent: round.affirmativeContent,
        negativeContent: round.negativeContent,
        timestamp: round.timestamp.toISOString()
      })),
      summary: transcript.summary
    };
  }

  /**
   * Converts serialized data back to a Transcript
   * Note: AIModelProvider instances are not restored, only their names
   */
  private deserializeTranscript(serialized: any): Transcript {
    // Create mock providers for deserialization
    // In a real scenario, you'd need to reconstruct the actual providers
    const mockAffirmativeProvider = {
      getModelName: () => serialized.debate.affirmativeModelName,
      generateResponse: async () => '',
      validateAvailability: async () => true,
      listAvailableModels: async () => [],
      generateResponseStream: async (_prompt: string, _context: any, _onChunk: (chunk: string) => void) => '',
      supportsStreaming: () => false
    };

    const mockNegativeProvider = {
      getModelName: () => serialized.debate.negativeModelName,
      generateResponse: async () => '',
      validateAvailability: async () => true,
      listAvailableModels: async () => [],
      generateResponseStream: async (_prompt: string, _context: any, _onChunk: (chunk: string) => void) => '',
      supportsStreaming: () => false
    };

    return {
      debate: {
        id: serialized.debate.id,
        topic: serialized.debate.topic,
        config: serialized.debate.config,
        affirmativeModel: mockAffirmativeProvider,
        negativeModel: mockNegativeProvider,
        state: serialized.debate.state,
        rounds: serialized.debate.rounds.map((round: any) => ({
          type: round.type,
          affirmativeStatement: round.affirmativeStatement,
          negativeStatement: round.negativeStatement,
          timestamp: new Date(round.timestamp)
        })),
        createdAt: new Date(serialized.debate.createdAt),
        completedAt: serialized.debate.completedAt ? new Date(serialized.debate.completedAt) : undefined
      },
      formattedRounds: serialized.formattedRounds.map((round: any) => ({
        roundType: round.roundType,
        affirmativeContent: round.affirmativeContent,
        negativeContent: round.negativeContent,
        timestamp: new Date(round.timestamp)
      })),
      summary: serialized.summary
    };
  }
}
