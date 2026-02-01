import { DebateTactic } from './DebateTactic';

export type CivilityLevel = number;      // 0 = hostile, 5 = balanced, 10 = respectful
export type MannerLevel = number;        // 0 = abrasive, 5 = conversational, 10 = formal
export type ResearchLevel = number;      // 0 = superficial, 5 = moderate, 10 = academic
export type RhetoricLevel = number;      // 0 = pure logic, 5 = balanced, 10 = heavy rhetoric

export interface PersonalityProfile {
  name?: string;
  civility: CivilityLevel;        // 0-10: hostile to respectful
  manner: MannerLevel;            // 0-10: abrasive to well-mannered
  researchDepth: ResearchLevel;   // 0-10: superficial to well-researched
  rhetoricUsage: RhetoricLevel;   // 0-10: pure logic to heavy rhetoric
  tactics: DebateTactic[];        // specific tactics to employ
  customInstructions?: string;    // additional personality notes
}
