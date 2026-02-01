import { UIConfig, DEFAULT_UI_CONFIG } from './UIConfig';
import { PersonalityProfile } from './PersonalityProfile';
import { ModeratorStrictness } from './ModeratorStrictness';
import { DebateTactic } from './DebateTactic';

export interface DebateConfig {
  timeLimit?: number;  // seconds per response
  wordLimit?: number;  // max words per statement
  strictMode: boolean; // validate on-topic responses
  showPreparation: boolean; // display preparation phase
  numCrossExamQuestions: number; // questions per side
  preparationTime?: number; // seconds allocated for preparation phase
  ui?: UIConfig; // UI configuration options
  
  // Advanced features
  moderatorEnabled?: boolean;
  moderatorStrictness?: ModeratorStrictness;
  affirmativePersonality?: PersonalityProfile | 'random' | 'default';
  negativePersonality?: PersonalityProfile | 'random' | 'default';
  allowedTactics?: DebateTactic[];
  forbiddenTactics?: DebateTactic[];
}

export const DEFAULT_CONFIG: DebateConfig = {
  timeLimit: 120, // 2 minutes per response
  wordLimit: 500, // reasonable statement length
  strictMode: false, // lenient by default
  showPreparation: true, // show research phase
  numCrossExamQuestions: 3, // 3 questions per side
  preparationTime: 180, // 3 minutes for preparation phase
  ui: DEFAULT_UI_CONFIG, // default UI configuration
  
  // Advanced features defaults
  moderatorEnabled: false,
  moderatorStrictness: ModeratorStrictness.MODERATE,
  affirmativePersonality: 'default',
  negativePersonality: 'default',
  allowedTactics: [],
  forbiddenTactics: []
};

/**
 * Calculates the effective preparation time for a debate based on personality profiles.
 * Takes the maximum preparation time needed by either debater based on their research depth.
 * 
 * Requirements:
 * - 7.4: High research depth increases preparation time
 * 
 * @param config - The debate configuration
 * @param affirmativeResearchDepth - Research depth of affirmative debater (0-10)
 * @param negativeResearchDepth - Research depth of negative debater (0-10)
 * @returns The adjusted preparation time in seconds
 */
export function calculateEffectivePreparationTime(
  config: DebateConfig,
  affirmativeResearchDepth: number,
  negativeResearchDepth: number
): number {
  const baseTime = config.preparationTime || DEFAULT_CONFIG.preparationTime!;
  
  // Calculate preparation time for each debater based on their research depth
  const affirmativeTime = calculatePreparationTimeForResearchDepth(baseTime, affirmativeResearchDepth);
  const negativeTime = calculatePreparationTimeForResearchDepth(baseTime, negativeResearchDepth);
  
  // Use the maximum time needed by either debater
  return Math.max(affirmativeTime, negativeTime);
}

/**
 * Calculates preparation time adjustment based on research depth.
 * 
 * @param baseTime - The base preparation time in seconds
 * @param researchDepth - The research depth level (0-10)
 * @returns The adjusted preparation time in seconds
 */
function calculatePreparationTimeForResearchDepth(baseTime: number, researchDepth: number): number {
  // Research depth scale:
  // 0-2 (low): 0.8x base time (less time needed for superficial research)
  // 3-7 (moderate): 1.0x base time (standard time)
  // 8-10 (high): 1.5x base time (more time for detailed research)
  
  if (researchDepth >= 8) {
    // High research depth: increase preparation time by 50%
    return Math.round(baseTime * 1.5);
  } else if (researchDepth <= 2) {
    // Low research depth: decrease preparation time by 20%
    return Math.round(baseTime * 0.8);
  } else {
    // Moderate research depth: use base time
    return baseTime;
  }
}
