export interface DebateConfig {
  timeLimit?: number;  // seconds per response
  wordLimit?: number;  // max words per statement
  strictMode: boolean; // validate on-topic responses
  showPreparation: boolean; // display preparation phase
  numCrossExamQuestions: number; // questions per side
  preparationTime?: number; // seconds allocated for preparation phase
}

export const DEFAULT_CONFIG: DebateConfig = {
  timeLimit: 120, // 2 minutes per response
  wordLimit: 500, // reasonable statement length
  strictMode: false, // lenient by default
  showPreparation: true, // show research phase
  numCrossExamQuestions: 3, // 3 questions per side
  preparationTime: 180 // 3 minutes for preparation phase
};
