import { CivilityLevel, MannerLevel, ResearchLevel, RhetoricLevel } from './PersonalityProfile';

export interface ProfileSummary {
  name: string;
  description: string;  // auto-generated from traits
  traits: {
    civility: CivilityLevel;
    manner: MannerLevel;
    researchDepth: ResearchLevel;
    rhetoricUsage: RhetoricLevel;
  };
}
