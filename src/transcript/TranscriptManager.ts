import { Debate } from '../models/Debate';
import { Transcript, TranscriptSummary, FormattedRound, OutputFormat } from '../models/Transcript';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface TranscriptManager {
  generateTranscript(debate: Debate): Transcript;
  formatTranscript(transcript: Transcript, format: OutputFormat): string;
  saveTranscript(transcript: Transcript): Promise<string>;
  loadTranscript(id: string): Promise<Transcript>;
}

export class TranscriptManagerImpl implements TranscriptManager {
  private transcriptsDir: string;

  constructor(transcriptsDir: string = './transcripts') {
    this.transcriptsDir = transcriptsDir;
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
      summary
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
   * Formats transcript as plain text
   */
  private formatAsText(transcript: Transcript): string {
    const lines: string[] = [];
    
    // Header
    lines.push('='.repeat(80));
    lines.push('DEBATE TRANSCRIPT');
    lines.push('='.repeat(80));
    lines.push('');
    
    // Summary
    lines.push(`Topic: ${transcript.summary.topic}`);
    lines.push(`Affirmative: ${transcript.summary.models.affirmative}`);
    lines.push(`Negative: ${transcript.summary.models.negative}`);
    lines.push(`Duration: ${transcript.summary.totalDuration.toFixed(2)}s`);
    lines.push(`Rounds: ${transcript.summary.roundCount}`);
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('');
    
    // Rounds
    for (const round of transcript.formattedRounds) {
      lines.push(`[${round.roundType.toUpperCase()}]`);
      lines.push('-'.repeat(80));
      
      if (round.affirmativeContent) {
        lines.push(`Affirmative (${transcript.summary.models.affirmative}):`);
        lines.push(round.affirmativeContent);
        lines.push('');
      }
      
      if (round.negativeContent) {
        lines.push(`Negative (${transcript.summary.models.negative}):`);
        lines.push(round.negativeContent);
        lines.push('');
      }
      
      lines.push('');
    }
    
    return lines.join('\n');
  }

  /**
   * Formats transcript as markdown
   */
  private formatAsMarkdown(transcript: Transcript): string {
    const lines: string[] = [];
    
    // Header
    lines.push('# Debate Transcript');
    lines.push('');
    
    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push(`**Topic:** ${transcript.summary.topic}`);
    lines.push('');
    lines.push(`**Participants:**`);
    lines.push(`- Affirmative: ${transcript.summary.models.affirmative}`);
    lines.push(`- Negative: ${transcript.summary.models.negative}`);
    lines.push('');
    lines.push(`**Duration:** ${transcript.summary.totalDuration.toFixed(2)}s`);
    lines.push(`**Rounds:** ${transcript.summary.roundCount}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    
    // Rounds
    for (const round of transcript.formattedRounds) {
      lines.push(`## ${this.capitalizeRoundType(round.roundType)}`);
      lines.push('');
      
      if (round.affirmativeContent) {
        lines.push(`### Affirmative (${transcript.summary.models.affirmative})`);
        lines.push('');
        lines.push(round.affirmativeContent);
        lines.push('');
      }
      
      if (round.negativeContent) {
        lines.push(`### Negative (${transcript.summary.models.negative})`);
        lines.push('');
        lines.push(round.negativeContent);
        lines.push('');
      }
    }
    
    return lines.join('\n');
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
