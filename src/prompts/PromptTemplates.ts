import { Position } from '../models/Position';
import { RoundType } from '../models/RoundType';
import { DebateContext } from '../models/DebateContext';

/**
 * Centralized prompt templates for all debate rounds.
 * Each template includes debate rules and format instructions to guide AI models
 * in generating appropriate responses for their assigned position.
 * 
 * Requirements:
 * - 4.1: Prompt models to research the debate topic
 * - 5.1: Provide context indicating affirmative position
 * - 5.2: Provide context indicating negative position
 */

/**
 * Common debate rules and guidelines included in all prompts
 */
const DEBATE_RULES = `
Debate Rules and Guidelines:
- Present clear, logical, and well-structured arguments
- Use evidence, facts, and reasoning to support your claims
- Address counterarguments thoughtfully and respectfully
- Maintain a professional and constructive tone throughout
- Stay focused on the debate topic at all times
- Avoid logical fallacies and unsupported assertions
- Build upon your previous arguments coherently
- Engage directly with your opponent's points when appropriate`;

/**
 * Format instructions for different round types
 */
const FORMAT_INSTRUCTIONS = {
  preparation: `
Format Instructions:
- Identify 3-5 key arguments for your position
- Gather relevant evidence and examples
- Anticipate potential counterarguments
- Organize your thoughts into a coherent structure
- Note any important facts, statistics, or expert opinions`,

  opening: `
Format Instructions:
- Begin with a clear thesis statement
- Present 2-4 main arguments supporting your position
- Provide evidence or reasoning for each argument
- Conclude with a strong summary of your stance
- Aim for clarity and persuasiveness`,

  rebuttal: `
Format Instructions:
- Address the strongest points from your opponent's opening
- Identify weaknesses or flaws in their reasoning
- Reinforce your own position with additional evidence
- Directly counter their main arguments
- Maintain focus on substantive disagreements`,

  crossExamQuestion: `
Format Instructions:
- Ask a focused, specific question
- Target a key weakness or assumption in their argument
- Seek clarification on ambiguous claims
- Challenge their evidence or reasoning
- Keep the question clear and direct`,

  crossExamAnswer: `
Format Instructions:
- Answer the question directly and clearly
- Defend your position with evidence
- Acknowledge valid points while maintaining your stance
- Use the opportunity to strengthen your argument
- Be concise but thorough`,

  closing: `
Format Instructions:
- Summarize your strongest arguments from the debate
- Highlight where you successfully countered your opponent
- Address any remaining concerns or objections
- Reinforce why your position is superior
- End with a compelling final statement`
};

/**
 * Generates the preparation phase prompt for a model to research and compose arguments.
 * 
 * @param topic - The debate topic
 * @param position - The model's assigned position (affirmative or negative)
 * @returns The complete preparation prompt
 */
export function getPreparationPrompt(topic: string, position: Position): string {
  const positionText = position === Position.AFFIRMATIVE 
    ? 'in favor of' 
    : 'against';
  
  return `You are participating in a formal debate on the topic: "${topic}"

Your Position: You are arguing ${positionText} this topic.

Task: Research this topic and prepare your arguments for the upcoming debate. This is your preparation phase where you will compose your initial strategy and identify key points.
${DEBATE_RULES}
${FORMAT_INSTRUCTIONS.preparation}

Please provide your preparation notes and initial argument outline.`;
}

/**
 * Generates the opening statement prompt for a model to present initial arguments.
 * 
 * @param topic - The debate topic
 * @param position - The model's assigned position (affirmative or negative)
 * @returns The complete opening statement prompt
 */
export function getOpeningStatementPrompt(topic: string, position: Position): string {
  const positionText = position === Position.AFFIRMATIVE 
    ? 'in favor of' 
    : 'against';
  
  return `You are participating in a formal debate on the topic: "${topic}"

Your Position: You are arguing ${positionText} this topic.

Round: Opening Statement

Task: Present your opening statement. This is your opportunity to establish your position and present your main arguments to support your stance.
${DEBATE_RULES}
${FORMAT_INSTRUCTIONS.opening}

Please provide your opening statement.`;
}

/**
 * Generates the rebuttal prompt for a model to respond to opponent's opening.
 * 
 * @param topic - The debate topic
 * @param position - The model's assigned position (affirmative or negative)
 * @param opponentOpening - The opponent's opening statement content
 * @returns The complete rebuttal prompt
 */
export function getRebuttalPrompt(
  topic: string, 
  position: Position, 
  opponentOpening: string
): string {
  const positionText = position === Position.AFFIRMATIVE 
    ? 'in favor of' 
    : 'against';
  
  return `You are participating in a formal debate on the topic: "${topic}"

Your Position: You are arguing ${positionText} this topic.

Round: Rebuttal

Your opponent's opening statement:
---
${opponentOpening}
---

Task: Present your rebuttal. Directly respond to your opponent's opening statement, addressing their key points and strengthening your own position.
${DEBATE_RULES}
${FORMAT_INSTRUCTIONS.rebuttal}

Please provide your rebuttal.`;
}

/**
 * Generates the cross-examination question prompt for a model to challenge opponent.
 * 
 * @param topic - The debate topic
 * @param position - The model's assigned position (affirmative or negative)
 * @param opponentStatements - Summary of opponent's opening and rebuttal
 * @returns The complete cross-examination question prompt
 */
export function getCrossExaminationQuestionPrompt(
  topic: string,
  position: Position,
  opponentStatements: string
): string {
  const positionText = position === Position.AFFIRMATIVE 
    ? 'in favor of' 
    : 'against';
  
  return `You are participating in a formal debate on the topic: "${topic}"

Your Position: You are arguing ${positionText} this topic.

Round: Cross-Examination (Question Phase)

Your opponent's statements so far:
---
${opponentStatements}
---

Task: pose a challenging question to your opponent. Based on their opening statement and rebuttal, ask a question that tests their position, challenges their reasoning, or seeks clarification on a weak point.
${DEBATE_RULES}
${FORMAT_INSTRUCTIONS.crossExamQuestion}

Please provide your question.`;
}

/**
 * Generates the cross-examination answer prompt for a model to respond to a question.
 * 
 * @param topic - The debate topic
 * @param position - The model's assigned position (affirmative or negative)
 * @param question - The question posed by the opponent
 * @returns The complete cross-examination answer prompt
 */
export function getCrossExaminationAnswerPrompt(
  topic: string,
  position: Position,
  question: string
): string {
  const positionText = position === Position.AFFIRMATIVE 
    ? 'in favor of' 
    : 'against';
  
  return `You are participating in a formal debate on the topic: "${topic}"

Your Position: You are arguing ${positionText} this topic.

Round: Cross-Examination (Answer Phase)

Your opponent has asked you the following question:
---
${question}
---

Task: Provide a clear and persuasive response that defends your position. Answer the question directly while using this opportunity to strengthen your argument.
${DEBATE_RULES}
${FORMAT_INSTRUCTIONS.crossExamAnswer}

Please provide your answer.`;
}

/**
 * Generates the closing statement prompt for a model to present final arguments.
 * 
 * @param topic - The debate topic
 * @param position - The model's assigned position (affirmative or negative)
 * @param debateSummary - Summary of all previous rounds
 * @returns The complete closing statement prompt
 */
export function getClosingStatementPrompt(
  topic: string,
  position: Position,
  debateSummary: string
): string {
  const positionText = position === Position.AFFIRMATIVE 
    ? 'in favor of' 
    : 'against';
  
  return `You are participating in a formal debate on the topic: "${topic}"

Your Position: You are arguing ${positionText} this topic.

Round: Closing Statement

Summary of the debate so far:
---
${debateSummary}
---

Task: Present your closing statement. This is your final opportunity to make your case. Summarize your strongest arguments, highlight where you successfully countered your opponent, and make a compelling final statement for your position.
${DEBATE_RULES}
${FORMAT_INSTRUCTIONS.closing}

Please provide your closing statement.`;
}

/**
 * Helper function to format previous statements for inclusion in prompts.
 * 
 * @param context - The debate context containing previous statements
 * @returns Formatted string of previous statements
 */
export function formatPreviousStatements(context: DebateContext): string {
  if (context.previousStatements.length === 0) {
    return '';
  }

  let formatted = '';
  for (const statement of context.previousStatements) {
    const roundLabel = getRoundLabel(statement);
    formatted += `[${statement.position.toUpperCase()} - ${roundLabel}]:\n${statement.content}\n\n`;
  }
  return formatted.trim();
}

/**
 * Helper function to get a readable label for a statement's round type.
 */
function getRoundLabel(statement: { position: Position; model?: string }): string {
  // This is a simplified version - in practice, you'd want to include the round type
  // from the statement if available
  return statement.model || 'Unknown';
}

/**
 * Builds a complete prompt for a given round type and context.
 * This is the main entry point for generating prompts in the orchestrator.
 * 
 * @param roundType - The type of round (preparation, opening, rebuttal, etc.)
 * @param context - The debate context
 * @param additionalData - Any additional data needed for specific round types
 * @returns The complete prompt for the round
 */
export function buildPromptForRound(
  roundType: RoundType,
  context: DebateContext,
  additionalData?: {
    opponentOpening?: string;
    opponentStatements?: string;
    question?: string;
    debateSummary?: string;
  }
): string {
  switch (roundType) {
    case RoundType.PREPARATION:
      return getPreparationPrompt(context.topic, context.position);
    
    case RoundType.OPENING:
      return getOpeningStatementPrompt(context.topic, context.position);
    
    case RoundType.REBUTTAL:
      if (!additionalData?.opponentOpening) {
        throw new Error('Opponent opening statement required for rebuttal prompt');
      }
      return getRebuttalPrompt(
        context.topic,
        context.position,
        additionalData.opponentOpening
      );
    
    case RoundType.CROSS_EXAM:
      // Cross-exam has two phases: question and answer
      // The caller needs to specify which phase via additionalData
      if (additionalData?.question) {
        // Answer phase
        return getCrossExaminationAnswerPrompt(
          context.topic,
          context.position,
          additionalData.question
        );
      } else if (additionalData?.opponentStatements) {
        // Question phase
        return getCrossExaminationQuestionPrompt(
          context.topic,
          context.position,
          additionalData.opponentStatements
        );
      } else {
        throw new Error('Either question or opponent statements required for cross-examination prompt');
      }
    
    case RoundType.CLOSING:
      if (!additionalData?.debateSummary) {
        throw new Error('Debate summary required for closing statement prompt');
      }
      return getClosingStatementPrompt(
        context.topic,
        context.position,
        additionalData.debateSummary
      );
    
    default:
      throw new Error(`Unknown round type: ${roundType}`);
  }
}
