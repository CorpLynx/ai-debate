export interface DebateConfig {
  timeLimit?: number;  // seconds per response
  wordLimit?: number;  // max words per statement
  strictMode: boolean; // validate on-topic responses
  showPreparation: boolean; // display preparation phase
  numCrossExamQuestions: number; // questions per side
}

export const DEFAULT_CONFIG: DebateConfig = {
  timeLimit: 120, // 2 minutes per response
  wordLimit: 500, // reasonable statement length
  strictMode: false, // lenient by default
  showPreparation: true, // show research phase
  numCrossExamQuestions: 3 // 3 questions per side
};
