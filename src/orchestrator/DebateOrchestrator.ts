import { Debate } from '../models/Debate';
import { DebateConfig } from '../models/DebateConfig';
import { DebateState } from '../models/DebateState';
import { AIModelProvider } from '../providers/AIModelProvider';
import { DebateValidator } from '../validators/DebateValidator';
import { Position } from '../models/Position';
import { RoundType } from '../models/RoundType';
import { DebateContext } from '../models/DebateContext';
import { Statement } from '../models/Statement';
import { randomUUID } from 'crypto';
import { ErrorLogger } from '../utils/ErrorLogger';
import { TranscriptManagerImpl } from '../transcript/TranscriptManager';
import { ConfigurationManager } from '../utils/ConfigurationManager';
import { StreamingHandler } from '../streaming/StreamingHandler';
import * as PromptTemplates from '../prompts/PromptTemplates';
import { CitationExtractor } from '../utils/CitationExtractor';
import { CitationTracker } from '../utils/CitationTracker';
import { BibliographyGenerator } from '../utils/BibliographyGenerator';

/**
 * Helper class to wrap streaming text output to fit within terminal width
 */
class StreamingLineWrapper {
  private buffer: string = '';
  private currentLine: string = '';
  private maxWidth: number;
  private indent: string = '  '; // 2 spaces indent

  constructor(maxWidth: number = 80) {
    this.maxWidth = maxWidth - 4; // Leave margin
  }

  /**
   * Process a chunk of streaming text and return wrapped output
   */
  processChunk(chunk: string): string {
    this.buffer += chunk;
    let output = '';

    // Process complete words (split by spaces)
    const parts = this.buffer.split(' ');
    
    // Keep the last part in buffer (might be incomplete word)
    if (parts.length > 1) {
      this.buffer = parts[parts.length - 1];
      
      // Process complete words
      for (let i = 0; i < parts.length - 1; i++) {
        const word = parts[i];
        
        // Check for newlines in the word
        if (word.includes('\n')) {
          const lines = word.split('\n');
          for (let j = 0; j < lines.length; j++) {
            if (j > 0) {
              // Newline found - flush current line
              output += this.currentLine + '\n';
              this.currentLine = this.indent;
            }
            if (lines[j]) {
              output += this.addWord(lines[j] + (j < lines.length - 1 ? '' : ' '));
            }
          }
        } else {
          output += this.addWord(word + ' ');
        }
      }
    }

    return output;
  }

  /**
   * Add a word to the current line, wrapping if necessary
   */
  private addWord(word: string): string {
    const wordLength = word.length;
    const currentLength = this.currentLine.length;

    // If adding this word would exceed width, wrap to new line
    if (currentLength + wordLength > this.maxWidth && this.currentLine.trim().length > 0) {
      const output = this.currentLine.trimEnd() + '\n';
      this.currentLine = this.indent + word;
      return output;
    }

    // Add word to current line
    if (this.currentLine.trim().length === 0) {
      this.currentLine = this.indent + word;
    } else {
      this.currentLine += word;
    }

    return '';
  }

  /**
   * Flush any remaining content
   */
  flush(): string {
    let output = '';
    
    // Process any remaining buffer
    if (this.buffer.trim()) {
      output += this.addWord(this.buffer);
    }
    
    // Output current line
    if (this.currentLine.trim()) {
      output += this.currentLine;
    }

    return output;
  }
}

export interface DebateOrchestrator {
  initializeDebate(topic: string, config: DebateConfig, affirmativeModel: AIModelProvider, negativeModel: AIModelProvider): Debate;
  executePreparation(debate: Debate): Promise<Debate>;
  executeOpeningStatements(debate: Debate): Promise<Debate>;
  executeRebuttals(debate: Debate): Promise<Debate>;
  executeCrossExamination(debate: Debate): Promise<Debate>;
  executeClosingStatements(debate: Debate): Promise<Debate>;
  getCurrentState(debate: Debate): DebateState;
}

// Valid state transitions map
const VALID_TRANSITIONS: Map<DebateState, DebateState[]> = new Map([
  [DebateState.INITIALIZED, [DebateState.PREPARATION]],
  [DebateState.PREPARATION, [DebateState.OPENING_STATEMENTS]],
  [DebateState.OPENING_STATEMENTS, [DebateState.REBUTTALS]],
  [DebateState.REBUTTALS, [DebateState.CROSS_EXAMINATION]],
  [DebateState.CROSS_EXAMINATION, [DebateState.CLOSING_STATEMENTS]],
  [DebateState.CLOSING_STATEMENTS, [DebateState.COMPLETED]],
  [DebateState.COMPLETED, []],
  [DebateState.ERROR, []]
]);

export class DebateOrchestratorImpl implements DebateOrchestrator {
  private validator: DebateValidator;
  private transcriptManager: TranscriptManagerImpl;
  private configManager: ConfigurationManager;
  private citationExtractor: CitationExtractor;
  private citationTracker: CitationTracker;
  private bibliographyGenerator: BibliographyGenerator;

  constructor(transcriptsDir?: string) {
    this.validator = new DebateValidator();
    this.transcriptManager = new TranscriptManagerImpl(transcriptsDir);
    this.configManager = new ConfigurationManager();
    this.citationExtractor = new CitationExtractor();
    this.citationTracker = new CitationTracker();
    this.bibliographyGenerator = new BibliographyGenerator();
  }
  
  /**
   * Initializes a new debate with the given topic and configuration.
   * Validates the topic and stores it in the debate session.
   * 
   * @param topic - The debate topic (must be non-empty with at least one non-whitespace character)
   * @param config - The debate configuration
   * @param affirmativeModel - The AI model taking the affirmative position
   * @param negativeModel - The AI model taking the negative position
   * @returns A new Debate object in INITIALIZED state
   * @throws Error if the topic is invalid
   */
  initializeDebate(
    topic: string, 
    config: DebateConfig,
    affirmativeModel: AIModelProvider,
    negativeModel: AIModelProvider
  ): Debate {
    // Validate the topic (Requirements 1.1, 1.4)
    const validationResult = this.validator.validateTopic(topic);
    if (!validationResult.isValid) {
      throw new Error(`Invalid debate topic: ${validationResult.errors.join(', ')}`);
    }

    // Reset citation tracking for new debate
    this.resetCitationTracking();

    // Store topic in debate session (Requirement 1.2)
    const debate: Debate = {
      id: randomUUID(),
      topic,
      config,
      affirmativeModel,
      negativeModel,
      state: DebateState.INITIALIZED,
      rounds: [],
      createdAt: new Date()
    };

    // Note: Display confirmation (Requirement 1.3) will be handled by CLI layer
    return debate;
  }

  /**
   * Executes the preparation phase where both models research the topic and compose arguments.
   * Prompts both models to prepare their arguments and stores the preparation materials.
   * Enforces preparation time limit if configured.
   * Uses streaming if available for real-time display.
   * 
   * @param debate - The current debate state
   * @returns Updated debate with preparation materials stored
   * @throws Error if state transition is invalid or critical error occurs
   */
  async executePreparation(debate: Debate): Promise<Debate> {
    this.validateTransition(debate.state, DebateState.PREPARATION);
    
    // Build context for preparation phase
    const affirmativeContext = {
      topic: debate.topic,
      position: Position.AFFIRMATIVE,
      roundType: RoundType.PREPARATION,
      previousStatements: []
    };
    
    const negativeContext = {
      topic: debate.topic,
      position: Position.NEGATIVE,
      roundType: RoundType.PREPARATION,
      previousStatements: []
    };
    
    // Generate prompts using centralized templates (Requirements 4.1, 4.2)
    const affirmativePrompt = PromptTemplates.getPreparationPrompt(debate.topic, Position.AFFIRMATIVE);
    const negativePrompt = PromptTemplates.getPreparationPrompt(debate.topic, Position.NEGATIVE);
    
    try {
      // Get preparation time limit (Requirements 5.5, 6.6)
      const preparationTimeMs = (debate.config.preparationTime || 180) * 1000;
      
      // Generate preparation materials from both models concurrently with timeout
      // Use streaming if available (Requirements 6.1, 6.2, 6.4, 6.5)
      const [affirmativePreparation, negativePreparation] = await this.executePreparationWithTimeout(
        debate,
        affirmativePrompt,
        negativePrompt,
        affirmativeContext,
        negativeContext,
        preparationTimeMs
      );
      
      // Extract citations from preparation materials (Requirement 12.2)
      this.extractAndTrackCitations(
        affirmativePreparation,
        debate.affirmativeModel.getModelName(),
        Position.AFFIRMATIVE,
        RoundType.PREPARATION
      );
      this.extractAndTrackCitations(
        negativePreparation,
        debate.negativeModel.getModelName(),
        Position.NEGATIVE,
        RoundType.PREPARATION
      );

      // Store preparation materials (Requirement 4.3)
      const preparationRound = {
        type: RoundType.PREPARATION,
        affirmativeStatement: {
          model: debate.affirmativeModel.getModelName(),
          position: Position.AFFIRMATIVE,
          content: affirmativePreparation,
          wordCount: affirmativePreparation.split(/\s+/).filter(w => w.length > 0).length,
          generatedAt: new Date()
        },
        negativeStatement: {
          model: debate.negativeModel.getModelName(),
          position: Position.NEGATIVE,
          content: negativePreparation,
          wordCount: negativePreparation.split(/\s+/).filter(w => w.length > 0).length,
          generatedAt: new Date()
        },
        timestamp: new Date()
      };
      
      return {
        ...debate,
        state: DebateState.PREPARATION,
        rounds: [...debate.rounds, preparationRound]
      };
    } catch (error) {
      // Critical error - save partial transcript and transition to ERROR state
      await this.handleCriticalError(debate, error as Error, RoundType.PREPARATION);
      throw error;
    }
  }

  /**
   * Executes preparation phase with timeout enforcement.
   * Generates preparation materials from both models concurrently, stopping when time limit is reached.
   * Uses streaming if available for real-time display (Requirements 6.1, 6.2, 6.4).
   * Includes retry logic for streaming failures (Requirement 6.6).
   * 
   * @param debate - Current debate state
   * @param affirmativePrompt - Prompt for affirmative model
   * @param negativePrompt - Prompt for negative model
   * @param affirmativeContext - Context for affirmative model
   * @param negativeContext - Context for negative model
   * @param timeoutMs - Timeout in milliseconds
   * @returns Tuple of [affirmativePreparation, negativePreparation]
   */
  private async executePreparationWithTimeout(
    debate: Debate,
    affirmativePrompt: string,
    negativePrompt: string,
    affirmativeContext: DebateContext,
    negativeContext: DebateContext,
    timeoutMs: number
  ): Promise<[string, string]> {
    return new Promise<[string, string]>(async (resolve, reject) => {
      let affirmativePreparation = '';
      let negativePreparation = '';
      let affirmativeComplete = false;
      let negativeComplete = false;
      let timedOut = false;

      // Create streaming handler for real-time display (Requirement 6.1)
      const uiConfig = debate.config.ui;
      const streamingHandler = new StreamingHandler(uiConfig);
      
      // Display preparation phase header (Requirement 6.1)
      streamingHandler.displayPhaseHeader();
      
      // Initialize progress bars if enabled (Requirements 11.1, 11.3)
      if (uiConfig?.showPreparationProgress) {
        streamingHandler.initializePreparationProgress(
          debate.affirmativeModel.getModelName(),
          debate.negativeModel.getModelName()
        );
      }

      // Create timeout
      const timeoutId = setTimeout(() => {
        timedOut = true;
        // Display timeout message for any incomplete preparations (Requirement 6.6)
        if (!affirmativeComplete && affirmativePreparation) {
          streamingHandler.onTimeout(
            debate.affirmativeModel.getModelName(),
            Position.AFFIRMATIVE,
            affirmativePreparation
          );
        }
        if (!negativeComplete && negativePreparation) {
          streamingHandler.onTimeout(
            debate.negativeModel.getModelName(),
            Position.NEGATIVE,
            negativePreparation
          );
        }
        console.warn(`\nPreparation time limit of ${timeoutMs / 1000} seconds reached. Proceeding to next phase...\n`);
        
        // Cleanup progress display on timeout
        if (uiConfig?.showPreparationProgress) {
          streamingHandler.cleanup();
        }
        
        resolve([affirmativePreparation, negativePreparation]);
      }, timeoutMs);

      try {
        // Check if models support streaming
        const affirmativeSupportsStreaming = debate.affirmativeModel.supportsStreaming();
        const negativeSupportsStreaming = debate.negativeModel.supportsStreaming();

        // Start both preparations concurrently
        const affirmativePromise = (async () => {
          // Display header for affirmative model (Requirement 6.4)
          streamingHandler.displayPreparationHeader(
            debate.affirmativeModel.getModelName(),
            Position.AFFIRMATIVE
          );

          let result: string = '';
          
          // Use streaming if available (Requirement 6.2), otherwise fall back to non-streaming (Requirement 6.5)
          if (affirmativeSupportsStreaming) {
            // Streaming path with error handling and partial content recovery
            try {
              let partialContent = '';
              result = await debate.affirmativeModel.generateResponseStream(
                affirmativePrompt,
                affirmativeContext,
                (chunk: string) => {
                  if (!timedOut) {
                    // Accumulate partial content for error recovery
                    partialContent += chunk;
                    affirmativePreparation = partialContent;
                    // Display chunk in real-time (Requirement 6.2)
                    streamingHandler.onChunk(chunk, debate.affirmativeModel.getModelName(), Position.AFFIRMATIVE);
                  }
                }
              );
            } catch (error) {
              if (!timedOut) {
                // Display error message with partial content info
                streamingHandler.onError(
                  error as Error,
                  debate.affirmativeModel.getModelName(),
                  Position.AFFIRMATIVE,
                  affirmativePreparation
                );
                
                // If we have partial content from streaming, use it instead of failing completely
                if (affirmativePreparation && affirmativePreparation.length > 0) {
                  console.warn(
                    `Using partial content from ${debate.affirmativeModel.getModelName()} (${affirmativePreparation.split(/\s+/).filter(w => w.length > 0).length} words)`
                  );
                  result = affirmativePreparation;
                } else {
                  // No partial content, propagate error
                  clearTimeout(timeoutId);
                  reject(error);
                  throw error;
                }
              } else {
                throw error;
              }
            }
          } else {
            // Fall back to non-streaming (Requirement 6.5) with existing retry logic
            try {
              result = await this.generateWithTimeout(debate, debate.affirmativeModel, affirmativePrompt, affirmativeContext);
              // Only display the complete result if NOT showing progress bars
              if (!uiConfig?.showPreparationProgress) {
                console.log(result);
              }
            } catch (error) {
              if (!timedOut) {
                clearTimeout(timeoutId);
                reject(error);
              }
              throw error;
            }
          }

          if (!timedOut) {
            affirmativePreparation = result;
            affirmativeComplete = true;
            
            // Display completion message (Requirement 6.4)
            streamingHandler.onComplete(debate.affirmativeModel.getModelName(), Position.AFFIRMATIVE);
            
            // Check if both are complete
            if (negativeComplete) {
              clearTimeout(timeoutId);
              resolve([affirmativePreparation, negativePreparation]);
            }
          }
          return result;
        })();

        const negativePromise = (async () => {
          // Display header for negative model (Requirement 6.4)
          streamingHandler.displayPreparationHeader(
            debate.negativeModel.getModelName(),
            Position.NEGATIVE
          );

          let result: string = '';
          
          // Use streaming if available (Requirement 6.2), otherwise fall back to non-streaming (Requirement 6.5)
          if (negativeSupportsStreaming) {
            // Streaming path with error handling and partial content recovery
            try {
              let partialContent = '';
              result = await debate.negativeModel.generateResponseStream(
                negativePrompt,
                negativeContext,
                (chunk: string) => {
                  if (!timedOut) {
                    // Accumulate partial content for error recovery
                    partialContent += chunk;
                    negativePreparation = partialContent;
                    // Display chunk in real-time (Requirement 6.2)
                    streamingHandler.onChunk(chunk, debate.negativeModel.getModelName(), Position.NEGATIVE);
                  }
                }
              );
            } catch (error) {
              if (!timedOut) {
                // Display error message with partial content info
                streamingHandler.onError(
                  error as Error,
                  debate.negativeModel.getModelName(),
                  Position.NEGATIVE,
                  negativePreparation
                );
                
                // If we have partial content from streaming, use it instead of failing completely
                if (negativePreparation && negativePreparation.length > 0) {
                  console.warn(
                    `Using partial content from ${debate.negativeModel.getModelName()} (${negativePreparation.split(/\s+/).filter(w => w.length > 0).length} words)`
                  );
                  result = negativePreparation;
                } else {
                  // No partial content, propagate error
                  clearTimeout(timeoutId);
                  reject(error);
                  throw error;
                }
              } else {
                throw error;
              }
            }
          } else {
            // Fall back to non-streaming (Requirement 6.5) with existing retry logic
            try {
              result = await this.generateWithTimeout(debate, debate.negativeModel, negativePrompt, negativeContext);
              // Only display the complete result if NOT showing progress bars
              if (!uiConfig?.showPreparationProgress) {
                console.log(result);
              }
            } catch (error) {
              if (!timedOut) {
                clearTimeout(timeoutId);
                reject(error);
              }
              throw error;
            }
          }

          if (!timedOut) {
            negativePreparation = result;
            negativeComplete = true;
            
            // Display completion message (Requirement 6.4)
            streamingHandler.onComplete(debate.negativeModel.getModelName(), Position.NEGATIVE);
            
            // Check if both are complete
            if (affirmativeComplete) {
              clearTimeout(timeoutId);
              resolve([affirmativePreparation, negativePreparation]);
            }
          }
          return result;
        })();

        // Wait for both to complete or timeout
        await Promise.all([affirmativePromise, negativePromise]);
        
        // Display completion summary and cleanup (Requirements 3.3, 11.4)
        if (uiConfig?.showPreparationProgress) {
          streamingHandler.displayCompletionSummary();
          streamingHandler.cleanup();
        }
      } catch (error) {
        clearTimeout(timeoutId);
        // Cleanup on error
        if (uiConfig?.showPreparationProgress) {
          streamingHandler.cleanup();
        }
        if (!timedOut) {
          reject(error);
        }
      }
    });
  }

  /**
   * Executes the opening statements round where both models present their initial arguments.
   * The affirmative model speaks first, followed by the negative model.
   * 
   * @param debate - The current debate state
   * @returns Updated debate with opening statements stored
   * @throws Error if state transition is invalid or critical error occurs
   * 
   * Requirements:
   * - 3.3: Affirmative model completes opening statement before negative model is prompted
   */
  async executeOpeningStatements(debate: Debate): Promise<Debate> {
    this.validateTransition(debate.state, DebateState.OPENING_STATEMENTS);
    
    // Build context for opening statements
    const affirmativeContext = this.buildContext(debate, Position.AFFIRMATIVE, RoundType.OPENING);
    const negativeContext = this.buildContext(debate, Position.NEGATIVE, RoundType.OPENING);
    
    // Generate prompts using centralized templates
    const affirmativePrompt = PromptTemplates.getOpeningStatementPrompt(debate.topic, Position.AFFIRMATIVE);
    const negativePrompt = PromptTemplates.getOpeningStatementPrompt(debate.topic, Position.NEGATIVE);
    
    try {
      // Requirement 3.3: Prompt affirmative model first
      const affirmativeResponse = await this.generateWithErrorHandling(
        debate,
        debate.affirmativeModel,
        affirmativePrompt,
        affirmativeContext,
        RoundType.OPENING,
        Position.AFFIRMATIVE
      );
      
      // Extract citations from affirmative opening (Requirement 12.2)
      this.extractAndTrackCitations(
        affirmativeResponse,
        debate.affirmativeModel.getModelName(),
        Position.AFFIRMATIVE,
        RoundType.OPENING
      );
      
      // Create affirmative statement
      const affirmativeStatement: Statement = {
        model: debate.affirmativeModel.getModelName(),
        position: Position.AFFIRMATIVE,
        content: affirmativeResponse,
        wordCount: affirmativeResponse.split(/\s+/).filter(w => w.length > 0).length,
        generatedAt: new Date()
      };
      
      // Requirement 3.3: Then prompt negative model
      const negativeResponse = await this.generateWithErrorHandling(
        debate,
        debate.negativeModel,
        negativePrompt,
        negativeContext,
        RoundType.OPENING,
        Position.NEGATIVE
      );
      
      // Extract citations from negative opening (Requirement 12.2)
      this.extractAndTrackCitations(
        negativeResponse,
        debate.negativeModel.getModelName(),
        Position.NEGATIVE,
        RoundType.OPENING
      );
      
      // Create negative statement
      const negativeStatement: Statement = {
        model: debate.negativeModel.getModelName(),
        position: Position.NEGATIVE,
        content: negativeResponse,
        wordCount: negativeResponse.split(/\s+/).filter(w => w.length > 0).length,
        generatedAt: new Date()
      };
      
      // Store both statements in debate rounds
      const openingRound = {
        type: RoundType.OPENING,
        affirmativeStatement,
        negativeStatement,
        timestamp: new Date()
      };
      
      return {
        ...debate,
        state: DebateState.OPENING_STATEMENTS,
        rounds: [...debate.rounds, openingRound]
      };
    } catch (error) {
      // Critical error - save partial transcript and transition to ERROR state
      await this.handleCriticalError(debate, error as Error, RoundType.OPENING);
      throw error;
    }
  }

  /**
   * Executes the rebuttals round where both models respond to their opponent's opening statements.
   * Each model receives the opponent's opening statement as context for their rebuttal.
   * 
   * @param debate - The current debate state
   * @returns Updated debate with rebuttal statements stored
   * @throws Error if state transition is invalid or critical error occurs
   * 
   * Requirements:
   * - 3.1: Rebuttals follow opening statements in the debate sequence
   * - 5.3: Rebuttal context includes opponent's opening statement
   */
  async executeRebuttals(debate: Debate): Promise<Debate> {
    this.validateTransition(debate.state, DebateState.REBUTTALS);
    
    // Build context for rebuttals (includes opponent's opening per Requirement 5.3)
    const affirmativeContext = this.buildContext(debate, Position.AFFIRMATIVE, RoundType.REBUTTAL);
    const negativeContext = this.buildContext(debate, Position.NEGATIVE, RoundType.REBUTTAL);
    
    // Get opponent's opening statements for the prompts
    const openingRound = debate.rounds.find(r => r.type === RoundType.OPENING);
    const negativeOpening = openingRound?.negativeStatement?.content || '';
    const affirmativeOpening = openingRound?.affirmativeStatement?.content || '';
    
    // Generate prompts using centralized templates
    const affirmativePrompt = PromptTemplates.getRebuttalPrompt(
      debate.topic,
      Position.AFFIRMATIVE,
      negativeOpening
    );
    const negativePrompt = PromptTemplates.getRebuttalPrompt(
      debate.topic,
      Position.NEGATIVE,
      affirmativeOpening
    );
    
    try {
      // Generate rebuttals for both models
      const affirmativeResponse = await this.generateWithErrorHandling(
        debate,
        debate.affirmativeModel,
        affirmativePrompt,
        affirmativeContext,
        RoundType.REBUTTAL,
        Position.AFFIRMATIVE
      );
      
      // Extract citations from affirmative rebuttal (Requirement 12.2)
      this.extractAndTrackCitations(
        affirmativeResponse,
        debate.affirmativeModel.getModelName(),
        Position.AFFIRMATIVE,
        RoundType.REBUTTAL
      );
      
      // Create affirmative rebuttal statement
      const affirmativeStatement: Statement = {
        model: debate.affirmativeModel.getModelName(),
        position: Position.AFFIRMATIVE,
        content: affirmativeResponse,
        wordCount: affirmativeResponse.split(/\s+/).filter(w => w.length > 0).length,
        generatedAt: new Date()
      };
      
      // Generate negative rebuttal
      const negativeResponse = await this.generateWithErrorHandling(
        debate,
        debate.negativeModel,
        negativePrompt,
        negativeContext,
        RoundType.REBUTTAL,
        Position.NEGATIVE
      );
      
      // Extract citations from negative rebuttal (Requirement 12.2)
      this.extractAndTrackCitations(
        negativeResponse,
        debate.negativeModel.getModelName(),
        Position.NEGATIVE,
        RoundType.REBUTTAL
      );
      
      // Create negative rebuttal statement
      const negativeStatement: Statement = {
        model: debate.negativeModel.getModelName(),
        position: Position.NEGATIVE,
        content: negativeResponse,
        wordCount: negativeResponse.split(/\s+/).filter(w => w.length > 0).length,
        generatedAt: new Date()
      };
      
      // Store rebuttal statements in debate rounds
      const rebuttalRound = {
        type: RoundType.REBUTTAL,
        affirmativeStatement,
        negativeStatement,
        timestamp: new Date()
      };
      
      return {
        ...debate,
        state: DebateState.REBUTTALS,
        rounds: [...debate.rounds, rebuttalRound]
      };
    } catch (error) {
      // Critical error - save partial transcript and transition to ERROR state
      await this.handleCriticalError(debate, error as Error, RoundType.REBUTTAL);
      throw error;
    }
  }

  /**
   * Executes the cross-examination round where models ask questions and respond to each other.
   * Turn sequence: affirmative asks → negative responds → negative asks → affirmative responds
   * 
   * @param debate - The current debate state
   * @returns Updated debate with cross-examination statements stored
   * @throws Error if state transition is invalid or critical error occurs
   * 
   * Requirements:
   * - 6.1: Affirmative model poses questions to negative model
   * - 6.2: Negative model responds to affirmative's question
   * - 6.3: Negative model poses questions to affirmative model
   * - 6.4: Affirmative model responds to negative's question
   * - 6.5: Context includes opponent's opening and rebuttal
   */
  async executeCrossExamination(debate: Debate): Promise<Debate> {
    this.validateTransition(debate.state, DebateState.CROSS_EXAMINATION);
    
    // Build context for cross-examination (includes opponent's opening and rebuttal per Requirement 6.5)
    const affirmativeContext = this.buildContext(debate, Position.AFFIRMATIVE, RoundType.CROSS_EXAM);
    const negativeContext = this.buildContext(debate, Position.NEGATIVE, RoundType.CROSS_EXAM);
    
    // Format opponent statements for cross-examination prompts
    const negativeStatements = PromptTemplates.formatPreviousStatements(affirmativeContext);
    const affirmativeStatements = PromptTemplates.formatPreviousStatements(negativeContext);
    
    try {
      // Cross-examination uses non-streaming to allow proper Q&A grouping
      // We'll display formatted output after all exchanges complete
      
      // Requirement 6.1: Affirmative asks question
      const affirmativeQuestionPrompt = PromptTemplates.getCrossExaminationQuestionPrompt(
        debate.topic,
        Position.AFFIRMATIVE,
        negativeStatements
      );
      
      const affirmativeQuestion = await this.generateWithErrorHandling(
        debate,
        debate.affirmativeModel,
        affirmativeQuestionPrompt,
        affirmativeContext,
        RoundType.CROSS_EXAM
        // No position = no streaming, allows proper grouping
      );
      
      // Requirement 6.2: Negative responds to affirmative's question
      const negativeResponsePrompt = PromptTemplates.getCrossExaminationAnswerPrompt(
        debate.topic,
        Position.NEGATIVE,
        affirmativeQuestion
      );
      
      const negativeResponse = await this.generateWithErrorHandling(
        debate,
        debate.negativeModel,
        negativeResponsePrompt,
        negativeContext,
        RoundType.CROSS_EXAM
        // No position = no streaming
      );
      
      // Requirement 6.3: Negative asks question
      const negativeQuestionPrompt = PromptTemplates.getCrossExaminationQuestionPrompt(
        debate.topic,
        Position.NEGATIVE,
        affirmativeStatements
      );
      
      const negativeQuestion = await this.generateWithErrorHandling(
        debate,
        debate.negativeModel,
        negativeQuestionPrompt,
        negativeContext,
        RoundType.CROSS_EXAM
        // No position = no streaming
      );
      
      // Requirement 6.4: Affirmative responds to negative's question
      const affirmativeResponsePrompt = PromptTemplates.getCrossExaminationAnswerPrompt(
        debate.topic,
        Position.AFFIRMATIVE,
        negativeQuestion
      );
      
      const affirmativeResponse = await this.generateWithErrorHandling(
        debate,
        debate.affirmativeModel,
        affirmativeResponsePrompt,
        affirmativeContext,
        RoundType.CROSS_EXAM
        // No position = no streaming
      );
      
      // Store the cross-examination as a combined statement for each position
      // Affirmative statement includes their question and response
      const affirmativeFullContent = `Question: ${affirmativeQuestion}\n\nResponse to opponent: ${affirmativeResponse}`;
      
      // Extract citations from affirmative cross-examination (Requirement 12.2)
      this.extractAndTrackCitations(
        affirmativeFullContent,
        debate.affirmativeModel.getModelName(),
        Position.AFFIRMATIVE,
        RoundType.CROSS_EXAM
      );
      
      const affirmativeStatement: Statement = {
        model: debate.affirmativeModel.getModelName(),
        position: Position.AFFIRMATIVE,
        content: affirmativeFullContent,
        wordCount: affirmativeFullContent.split(/\s+/).filter(w => w.length > 0).length,
        generatedAt: new Date()
      };
      
      // Negative statement includes their response and question
      const negativeFullContent = `Response to opponent: ${negativeResponse}\n\nQuestion: ${negativeQuestion}`;
      
      // Extract citations from negative cross-examination (Requirement 12.2)
      this.extractAndTrackCitations(
        negativeFullContent,
        debate.negativeModel.getModelName(),
        Position.NEGATIVE,
        RoundType.CROSS_EXAM
      );
      
      const negativeStatement: Statement = {
        model: debate.negativeModel.getModelName(),
        position: Position.NEGATIVE,
        content: negativeFullContent,
        wordCount: negativeFullContent.split(/\s+/).filter(w => w.length > 0).length,
        generatedAt: new Date()
      };
      
      // Store cross-examination round
      const crossExamRound = {
        type: RoundType.CROSS_EXAM,
        affirmativeStatement,
        negativeStatement,
        timestamp: new Date()
      };
      
      return {
        ...debate,
        state: DebateState.CROSS_EXAMINATION,
        rounds: [...debate.rounds, crossExamRound]
      };
    } catch (error) {
      // Critical error - save partial transcript and transition to ERROR state
      await this.handleCriticalError(debate, error as Error, RoundType.CROSS_EXAM);
      throw error;
    }
  }

  /**
   * Executes the closing statements round where both models present their final arguments.
   * Each model receives all previous statements as context for their closing statement.
   * After both closing statements are stored, the debate can be marked as completed via completeDebate().
   * 
   * @param debate - The current debate state
   * @returns Updated debate with closing statements stored and state set to CLOSING_STATEMENTS
   * @throws Error if state transition is invalid or critical error occurs
   * 
   * Requirements:
   * - 3.1: Closing statements follow cross-examination in the debate sequence
   * - 5.4: Closing context includes all previous statements
   */
  async executeClosingStatements(debate: Debate): Promise<Debate> {
    this.validateTransition(debate.state, DebateState.CLOSING_STATEMENTS);
    
    // Build context for closing statements (includes all previous statements per Requirement 5.4)
    const affirmativeContext = this.buildContext(debate, Position.AFFIRMATIVE, RoundType.CLOSING);
    const negativeContext = this.buildContext(debate, Position.NEGATIVE, RoundType.CLOSING);
    
    // Format debate summary for closing statement prompts
    const debateSummary = PromptTemplates.formatPreviousStatements(affirmativeContext);
    
    // Generate prompts using centralized templates
    const affirmativePrompt = PromptTemplates.getClosingStatementPrompt(
      debate.topic,
      Position.AFFIRMATIVE,
      debateSummary
    );
    const negativePrompt = PromptTemplates.getClosingStatementPrompt(
      debate.topic,
      Position.NEGATIVE,
      debateSummary
    );
    
    try {
      // Generate closing statements for both models
      const affirmativeResponse = await this.generateWithErrorHandling(
        debate,
        debate.affirmativeModel,
        affirmativePrompt,
        affirmativeContext,
        RoundType.CLOSING,
        Position.AFFIRMATIVE
      );
      
      // Extract citations from affirmative closing (Requirement 12.2)
      this.extractAndTrackCitations(
        affirmativeResponse,
        debate.affirmativeModel.getModelName(),
        Position.AFFIRMATIVE,
        RoundType.CLOSING
      );
      
      // Create affirmative closing statement
      const affirmativeStatement: Statement = {
        model: debate.affirmativeModel.getModelName(),
        position: Position.AFFIRMATIVE,
        content: affirmativeResponse,
        wordCount: affirmativeResponse.split(/\s+/).filter(w => w.length > 0).length,
        generatedAt: new Date()
      };
      
      // Generate negative closing statement
      const negativeResponse = await this.generateWithErrorHandling(
        debate,
        debate.negativeModel,
        negativePrompt,
        negativeContext,
        RoundType.CLOSING,
        Position.NEGATIVE
      );
      
      // Extract citations from negative closing (Requirement 12.2)
      this.extractAndTrackCitations(
        negativeResponse,
        debate.negativeModel.getModelName(),
        Position.NEGATIVE,
        RoundType.CLOSING
      );
      
      // Create negative closing statement
      const negativeStatement: Statement = {
        model: debate.negativeModel.getModelName(),
        position: Position.NEGATIVE,
        content: negativeResponse,
        wordCount: negativeResponse.split(/\s+/).filter(w => w.length > 0).length,
        generatedAt: new Date()
      };
      
      // Store closing statements in debate rounds
      const closingRound = {
        type: RoundType.CLOSING,
        affirmativeStatement,
        negativeStatement,
        timestamp: new Date()
      };
      
      // Update debate with closing statements and transition to CLOSING_STATEMENTS state
      // Note: Call completeDebate() separately to mark debate as completed (Requirement 3.1)
      return {
        ...debate,
        state: DebateState.CLOSING_STATEMENTS,
        rounds: [...debate.rounds, closingRound]
      };
    } catch (error) {
      // Critical error - save partial transcript and transition to ERROR state
      await this.handleCriticalError(debate, error as Error, RoundType.CLOSING);
      throw error;
    }
  }

  getCurrentState(debate: Debate): DebateState {
    return debate.state;
  }

  private validateTransition(currentState: DebateState, nextState: DebateState): void {
    const validNextStates = VALID_TRANSITIONS.get(currentState);
    
    if (!validNextStates || !validNextStates.includes(nextState)) {
      throw new Error(
        `Invalid state transition: cannot transition from ${currentState} to ${nextState}`
      );
    }
  }

  /**
   * Transitions debate to COMPLETED state after closing statements
   * Also passes citations to transcript manager for inclusion in transcript
   */
  async completeDebate(debate: Debate): Promise<Debate> {
    this.validateTransition(debate.state, DebateState.COMPLETED);
    
    // Pass citations to transcript manager for inclusion in transcript
    const allCitations = this.citationTracker.getAllCitations();
    this.transcriptManager.setCitations(allCitations);
    
    return {
      ...debate,
      state: DebateState.COMPLETED,
      completedAt: new Date()
    };
  }

  /**
   * Gets all tracked citations
   * @returns Array of all citations tracked during the debate
   */
  getCitations(): any[] {
    return this.citationTracker.getAllCitations();
  }

  /**
   * Builds the appropriate context for a model to generate a statement.
   * The context includes the debate topic, the model's position, the round type,
   * and relevant previous statements based on the round type.
   * 
   * Requirements:
   * - 5.1, 5.2: Include position indicator (affirmative/negative) in context
   * - 5.3: For rebuttals, include opponent's opening statement
   * - 5.4: For closing statements, include all previous statements
   * - 6.5: For cross-examination, include opponent's opening and rebuttal
   * 
   * @param debate - The current debate state
   * @param position - The position of the model generating the statement
   * @param roundType - The type of round for which context is being built
   * @returns DebateContext object with appropriate information for the round
   */
  buildContext(debate: Debate, position: Position, roundType: RoundType): DebateContext {
    const context: DebateContext = {
      topic: debate.topic,
      position, // Requirements 5.1, 5.2: Include position indicator
      roundType,
      previousStatements: []
    };

    // Get preparation material for this position if available
    const preparationRound = debate.rounds.find(r => r.type === RoundType.PREPARATION);
    if (preparationRound) {
      const preparationStatement = position === Position.AFFIRMATIVE 
        ? preparationRound.affirmativeStatement 
        : preparationRound.negativeStatement;
      context.preparationMaterial = preparationStatement?.content;
    }

    // Determine which previous statements to include based on round type
    switch (roundType) {
      case RoundType.PREPARATION:
        // No previous statements for preparation
        break;

      case RoundType.OPENING:
        // No previous debate statements for opening (only preparation)
        break;

      case RoundType.REBUTTAL:
        // Requirement 5.3: Include opponent's opening statement
        context.previousStatements = this.getOpponentStatements(debate, position, [RoundType.OPENING]);
        break;

      case RoundType.CROSS_EXAM:
        // Requirement 6.5: Include opponent's opening and rebuttal
        context.previousStatements = this.getOpponentStatements(debate, position, [RoundType.OPENING, RoundType.REBUTTAL]);
        break;

      case RoundType.CLOSING:
        // Requirement 5.4: Include all previous statements
        context.previousStatements = this.getAllStatements(debate, [
          RoundType.OPENING,
          RoundType.REBUTTAL,
          RoundType.CROSS_EXAM
        ]);
        break;
    }

    return context;
  }

  /**
   * Helper method to get opponent's statements from specific round types
   */
  private getOpponentStatements(debate: Debate, position: Position, roundTypes: RoundType[]): Statement[] {
    const opponentPosition = position === Position.AFFIRMATIVE ? Position.NEGATIVE : Position.AFFIRMATIVE;
    const statements: Statement[] = [];

    for (const roundType of roundTypes) {
      const round = debate.rounds.find(r => r.type === roundType);
      if (round) {
        const opponentStatement = opponentPosition === Position.AFFIRMATIVE
          ? round.affirmativeStatement
          : round.negativeStatement;
        if (opponentStatement) {
          statements.push(opponentStatement);
        }
      }
    }

    return statements;
  }

  /**
   * Helper method to get all statements from specific round types (both positions)
   */
  private getAllStatements(debate: Debate, roundTypes: RoundType[]): Statement[] {
    const statements: Statement[] = [];

    for (const roundType of roundTypes) {
      const round = debate.rounds.find(r => r.type === roundType);
      if (round) {
        // Add affirmative statement first (they go first in each round)
        if (round.affirmativeStatement) {
          statements.push(round.affirmativeStatement);
        }
        if (round.negativeStatement) {
          statements.push(round.negativeStatement);
        }
      }
    }

    return statements;
  }

  /**
   * Wraps model generation with error handling, timeout, and retry logic
   * Logs errors with context and notifies user
   * Supports streaming if the model supports it
   * 
   * @param debate - Current debate state
   * @param model - The AI model provider
   * @param prompt - The prompt to send to the model
   * @param context - The debate context
   * @param round - The current round type
   * @param position - The debate position (for streaming display)
   * @returns The generated response (with word limit enforced if configured)
   * @throws Error if generation fails after retry
   */
  private async generateWithErrorHandling(
    debate: Debate,
    model: AIModelProvider,
    prompt: string,
    context: DebateContext,
    round: RoundType,
    position?: Position
  ): Promise<string> {
    try {
      let response: string;
      
      // Use streaming if model supports it and position is provided
      if (position && model.supportsStreaming()) {
        const streamingHandler = new StreamingHandler(debate.config.ui);
        
        // Display round header
        console.log(''); // Spacing
        streamingHandler.displayStreamLabel(model.getModelName(), position);
        
        // Create a line wrapper for streaming output
        const wrapper = new StreamingLineWrapper(80); // Max 80 chars per line
        
        let accumulatedContent = '';
        response = await model.generateResponseStream(
          prompt,
          context,
          (chunk: string) => {
            accumulatedContent += chunk;
            // Wrap and display chunk in real-time
            const wrappedChunk = wrapper.processChunk(chunk);
            if (wrappedChunk) {
              process.stdout.write(wrappedChunk);
            }
          }
        );
        
        // Flush any remaining content
        const finalChunk = wrapper.flush();
        if (finalChunk) {
          process.stdout.write(finalChunk);
        }
        
        // Display completion
        console.log(''); // Newline after content
        streamingHandler.displayStreamEnd(model.getModelName(), position);
      } else {
        // Fall back to non-streaming
        response = await this.generateWithTimeout(debate, model, prompt, context);
      }
      
      // Enforce word limit if configured (Requirement 10.2)
      return this.enforceWordLimitOnResponse(response, debate.config);
    } catch (error) {
      // Log error with context (Requirement 9.1)
      const updatedDebate = ErrorLogger.logError(
        debate,
        error as Error,
        model.getModelName(),
        round
      );
      
      // Update the debate reference with logged error
      Object.assign(debate, updatedDebate);
      
      // Notify user with clear error description (Requirement 9.4)
      const notification = ErrorLogger.formatErrorNotification(
        updatedDebate.errors![updatedDebate.errors!.length - 1]
      );
      console.error(notification);
      
      // Re-throw to allow caller to handle
      throw error;
    }
  }

  /**
   * Enforces word limit on a generated response by truncating if necessary.
   * 
   * @param response - The generated response text
   * @param config - The debate configuration
   * @returns The response, truncated if it exceeds the word limit
   */
  private enforceWordLimitOnResponse(response: string, config: DebateConfig): string {
    // Check if word limit is configured and response exceeds it
    if (this.configManager.exceedsWordLimit(response, config)) {
      const truncated = this.configManager.enforceWordLimit(response, config.wordLimit!);
      console.warn(`Response exceeded word limit of ${config.wordLimit}, truncated from ${response.split(/\s+/).filter(w => w.length > 0).length} to ${config.wordLimit} words`);
      return truncated;
    }
    
    return response;
  }

  /**
   * Generates a response with timeout and retry logic
   * Implements single retry on timeout with exponential backoff (Requirement 9.2)
   * 
   * @param debate - Current debate state
   * @param model - The AI model provider
   * @param prompt - The prompt to send to the model
   * @param context - The debate context
   * @returns The generated response
   * @throws Error if generation fails after retry
   */
  private async generateWithTimeout(
    debate: Debate,
    model: AIModelProvider,
    prompt: string,
    context: DebateContext
  ): Promise<string> {
    const timeoutMs = (debate.config.timeLimit || 120) * 1000; // Convert seconds to milliseconds
    const backoffMs = timeoutMs * 1.5; // Exponential backoff: 1.5x the original timeout
    
    // First attempt
    try {
      return await this.executeWithTimeout(model, prompt, context, timeoutMs);
    } catch (error) {
      // Check if it's a timeout error
      if (error instanceof Error && error.message.includes('timeout')) {
        // Requirement 9.2: Retry the request once with exponential backoff
        console.warn(`Request timed out after ${timeoutMs}ms, retrying with ${backoffMs}ms timeout...`);
        
        try {
          return await this.executeWithTimeout(model, prompt, context, backoffMs);
        } catch (retryError) {
          // Report failure after retry exhausted
          throw new Error(`Request failed after retry: ${(retryError as Error).message}`);
        }
      }
      
      // Not a timeout error, throw immediately
      throw error;
    }
  }

  /**
   * Executes a model generation with a timeout
   * 
   * @param model - The AI model provider
   * @param prompt - The prompt to send to the model
   * @param context - The debate context
   * @param timeoutMs - Timeout in milliseconds
   * @returns The generated response
   * @throws Error if generation times out or fails
   */
  private async executeWithTimeout(
    model: AIModelProvider,
    prompt: string,
    context: DebateContext,
    timeoutMs: number
  ): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      // Create timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`Model generation timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      
      try {
        const response = await model.generateResponse(prompt, context);
        clearTimeout(timeoutId);
        resolve(response);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Handles critical errors by saving partial transcript
   * 
   * @param debate - Current debate state
   * @param error - The error that occurred
   * @param round - The round where the error occurred
   */
  private async handleCriticalError(
    debate: Debate,
    error: Error,
    round?: RoundType
  ): Promise<void> {
    // Log the error
    const updatedDebate = ErrorLogger.logError(
      debate,
      error,
      undefined,
      round
    );
    
    // Save partial transcript (Requirement 9.3)
    try {
      const filePath = await this.transcriptManager.savePartialTranscript(updatedDebate);
      console.error(`Partial transcript saved to: ${filePath}`);
    } catch (saveError) {
      console.error('Failed to save partial transcript:', saveError);
    }
    
    // Transition to ERROR state
    updatedDebate.state = DebateState.ERROR;
    Object.assign(debate, updatedDebate);
  }

  /**
   * Extracts citations from a statement and adds them to the citation tracker.
   * Requirements: 12.2 - Extract and record citations from statements
   * 
   * @param content - The statement content to extract citations from
   * @param model - The model name that generated the statement
   * @param position - The debate position
   * @param round - The round type
   */
  private extractAndTrackCitations(
    content: string,
    model: string,
    position: Position,
    round: RoundType
  ): void {
    // Extract citations from the statement content
    const citations = this.citationExtractor.extractCitations(content, model, position, round);
    
    // Add citations to the tracker (automatically deduplicates)
    this.citationTracker.addCitations(citations);
  }

  /**
   * Displays the bibliography at the end of the debate.
   * Requirements: 12.1, 12.3, 12.4, 12.5 - Display bibliography with all citations
   */
  displayBibliography(): void {
    const allCitations = this.citationTracker.getAllCitations();
    
    if (allCitations.length === 0) {
      return; // No citations to display
    }

    // Generate and display the formatted bibliography
    const bibliography = this.bibliographyGenerator.generateBibliography(allCitations);
    console.log('\n');
    console.log(bibliography);
  }

  /**
   * Resets the citation tracker for a new debate.
   * Should be called when initializing a new debate.
   */
  resetCitationTracking(): void {
    this.citationTracker.clear();
  }
}
