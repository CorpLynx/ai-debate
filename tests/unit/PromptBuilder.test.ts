import { PromptBuilder } from '../../src/prompts/PromptBuilder';
import { Position } from '../../src/models/Position';
import { DebateTactic } from '../../src/models/DebateTactic';
import { PersonalityProfile } from '../../src/models/PersonalityProfile';

describe('PromptBuilder', () => {
  let builder: PromptBuilder;

  beforeEach(() => {
    builder = new PromptBuilder();
  });

  describe('buildDebaterPrompt', () => {
    it('should build a basic prompt for affirmative position', () => {
      const personality: PersonalityProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const prompt = builder.buildDebaterPrompt(
        Position.AFFIRMATIVE,
        personality,
        []
      );

      expect(prompt).toContain('affirmative');
      expect(prompt).toContain('in favor of the topic');
      expect(prompt).toContain('skilled debater');
    });

    it('should build a basic prompt for negative position', () => {
      const personality: PersonalityProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const prompt = builder.buildDebaterPrompt(
        Position.NEGATIVE,
        personality,
        []
      );

      expect(prompt).toContain('negative');
      expect(prompt).toContain('against the topic');
      expect(prompt).toContain('skilled debater');
    });

    it('should include custom instructions when provided', () => {
      const personality: PersonalityProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: [],
        customInstructions: 'Be extra careful with statistics'
      };

      const prompt = builder.buildDebaterPrompt(
        Position.AFFIRMATIVE,
        personality,
        []
      );

      expect(prompt).toContain('Be extra careful with statistics');
      expect(prompt).toContain('Additional Instructions');
    });

    it('should handle empty tactics array', () => {
      const personality: PersonalityProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const prompt = builder.buildDebaterPrompt(
        Position.AFFIRMATIVE,
        personality,
        []
      );

      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe('string');
    });

    it('should handle NONE tactic', () => {
      const personality: PersonalityProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: [DebateTactic.NONE]
      };

      const prompt = builder.buildDebaterPrompt(
        Position.AFFIRMATIVE,
        personality,
        [DebateTactic.NONE]
      );

      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe('string');
    });
  });

  describe('addPersonalityInstructions', () => {
    it('should add custom instructions to base prompt', () => {
      const basePrompt = 'Base prompt text';
      const personality: PersonalityProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: [],
        customInstructions: 'Custom instruction text'
      };

      const result = builder.addPersonalityInstructions(basePrompt, personality);

      expect(result).toContain('Base prompt text');
      expect(result).toContain('Custom instruction text');
    });

    it('should include civility instructions even when no custom instructions', () => {
      const basePrompt = 'Base prompt text';
      const personality: PersonalityProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const result = builder.addPersonalityInstructions(basePrompt, personality);

      expect(result).toContain('Base prompt text');
      expect(result).toContain('Civility Guidelines');
    });
  });

  describe('addTacticGuidelines', () => {
    it('should add logical argumentation guidelines for empty tactics', () => {
      const basePrompt = 'Base prompt text';
      const result = builder.addTacticGuidelines(basePrompt, []);

      expect(result).toContain(basePrompt);
      expect(result).toContain('Logical Argumentation Guidelines');
      expect(result).toContain('valid logical arguments');
    });

    it('should add logical argumentation guidelines for NONE tactic', () => {
      const basePrompt = 'Base prompt text';
      const result = builder.addTacticGuidelines(basePrompt, [DebateTactic.NONE]);

      expect(result).toContain(basePrompt);
      expect(result).toContain('Logical Argumentation Guidelines');
      expect(result).toContain('valid logical arguments');
    });
  });

  describe('buildContextReminder', () => {
    it('should build context reminder with all personality traits', () => {
      const personality: PersonalityProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const result = builder.buildContextReminder(personality);

      expect(result).toContain('Personality Reminders');
      expect(result).toContain('Balance respect with assertiveness');
      expect(result).toContain('conversational but firm');
      expect(result).toContain('Balance evidence with broader arguments');
      expect(result).toContain('Blend logic with persuasive elements');
    });

    it('should include high civility reminder', () => {
      const personality: PersonalityProfile = {
        civility: 9,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const result = builder.buildContextReminder(personality);

      expect(result).toContain('respectful and courteous');
    });

    it('should include low civility reminder', () => {
      const personality: PersonalityProfile = {
        civility: 1,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const result = builder.buildContextReminder(personality);

      expect(result).toContain('aggressively');
    });

    it('should include tactics reminder when tactics are specified', () => {
      const personality: PersonalityProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: [DebateTactic.GISH_GALLOP, DebateTactic.STRAWMAN]
      };

      const result = builder.buildContextReminder(personality);

      expect(result).toContain('gish gallop');
      expect(result).toContain('strawman');
    });
  });

  describe('getCivilityInstructions', () => {
    it('should return high civility instructions for level 8-10', () => {
      const instructions8 = builder.getCivilityInstructions(8);
      const instructions9 = builder.getCivilityInstructions(9);
      const instructions10 = builder.getCivilityInstructions(10);

      expect(instructions8).toContain('respectful');
      expect(instructions8).toContain('Acknowledge valid points');
      expect(instructions9).toContain('respectful');
      expect(instructions10).toContain('respectful');
    });

    it('should return low civility instructions for level 0-2', () => {
      const instructions0 = builder.getCivilityInstructions(0);
      const instructions1 = builder.getCivilityInstructions(1);
      const instructions2 = builder.getCivilityInstructions(2);

      expect(instructions0).toContain('dismissive');
      expect(instructions0).toContain('aggressively');
      expect(instructions1).toContain('dismissive');
      expect(instructions2).toContain('dismissive');
    });

    it('should return moderate civility instructions for level 3-7', () => {
      const instructions3 = builder.getCivilityInstructions(3);
      const instructions5 = builder.getCivilityInstructions(5);
      const instructions7 = builder.getCivilityInstructions(7);

      expect(instructions3).toContain('Balance respect with assertiveness');
      expect(instructions5).toContain('Balance respect with assertiveness');
      expect(instructions7).toContain('Balance respect with assertiveness');
    });
  });

  describe('addPersonalityInstructions with civility', () => {
    it('should include civility instructions in the prompt', () => {
      const basePrompt = 'Base prompt text';
      const personality: PersonalityProfile = {
        civility: 9,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const result = builder.addPersonalityInstructions(basePrompt, personality);

      expect(result).toContain('Base prompt text');
      expect(result).toContain('Civility Guidelines');
      expect(result).toContain('respectful');
    });

    it('should include both civility and custom instructions', () => {
      const basePrompt = 'Base prompt text';
      const personality: PersonalityProfile = {
        civility: 1,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: [],
        customInstructions: 'Custom instruction text'
      };

      const result = builder.addPersonalityInstructions(basePrompt, personality);

      expect(result).toContain('Base prompt text');
      expect(result).toContain('Civility Guidelines');
      expect(result).toContain('dismissive');
      expect(result).toContain('Custom instruction text');
    });
  });

  describe('getMannerInstructions', () => {
    it('should return well-mannered instructions for level 8-10', () => {
      const instructions8 = builder.getMannerInstructions(8);
      const instructions9 = builder.getMannerInstructions(9);
      const instructions10 = builder.getMannerInstructions(10);

      expect(instructions8).toContain('formal');
      expect(instructions8).toContain('professional');
      expect(instructions8).toContain('Avoid personal attacks');
      expect(instructions9).toContain('formal');
      expect(instructions10).toContain('formal');
    });

    it('should return abrasive instructions for level 0-2', () => {
      const instructions0 = builder.getMannerInstructions(0);
      const instructions1 = builder.getMannerInstructions(1);
      const instructions2 = builder.getMannerInstructions(2);

      expect(instructions0).toContain('sharp');
      expect(instructions0).toContain('direct confrontation');
      expect(instructions1).toContain('sharp');
      expect(instructions2).toContain('sharp');
    });

    it('should return moderate manner instructions for level 3-7', () => {
      const instructions3 = builder.getMannerInstructions(3);
      const instructions5 = builder.getMannerInstructions(5);
      const instructions7 = builder.getMannerInstructions(7);

      expect(instructions3).toContain('conversational but firm');
      expect(instructions5).toContain('conversational but firm');
      expect(instructions7).toContain('conversational but firm');
    });
  });

  describe('getResearchInstructions', () => {
    it('should return high research instructions for level 8-10', () => {
      const instructions8 = builder.getResearchInstructions(8);
      const instructions9 = builder.getResearchInstructions(9);
      const instructions10 = builder.getResearchInstructions(10);

      expect(instructions8).toContain('Cite specific sources');
      expect(instructions8).toContain('data');
      expect(instructions8).toContain('detailed evidence');
      expect(instructions9).toContain('sources');
      expect(instructions10).toContain('sources');
    });

    it('should return low research instructions for level 0-2', () => {
      const instructions0 = builder.getResearchInstructions(0);
      const instructions1 = builder.getResearchInstructions(1);
      const instructions2 = builder.getResearchInstructions(2);

      expect(instructions0).toContain('general claims');
      expect(instructions0).toContain('common knowledge');
      expect(instructions1).toContain('general');
      expect(instructions2).toContain('general');
    });

    it('should return moderate research instructions for level 3-7', () => {
      const instructions3 = builder.getResearchInstructions(3);
      const instructions5 = builder.getResearchInstructions(5);
      const instructions7 = builder.getResearchInstructions(7);

      expect(instructions3).toContain('Balance');
      expect(instructions3).toContain('evidence');
      expect(instructions5).toContain('Balance');
      expect(instructions7).toContain('Balance');
    });
  });

  describe('getRhetoricInstructions', () => {
    it('should return high rhetoric instructions for level 8-10', () => {
      const instructions8 = builder.getRhetoricInstructions(8);
      const instructions9 = builder.getRhetoricInstructions(9);
      const instructions10 = builder.getRhetoricInstructions(10);

      expect(instructions8).toContain('emotional appeals');
      expect(instructions8).toContain('analogies');
      expect(instructions8).toContain('persuasive techniques');
      expect(instructions9).toContain('emotional');
      expect(instructions10).toContain('emotional');
    });

    it('should return low rhetoric instructions for level 0-2', () => {
      const instructions0 = builder.getRhetoricInstructions(0);
      const instructions1 = builder.getRhetoricInstructions(1);
      const instructions2 = builder.getRhetoricInstructions(2);

      expect(instructions0).toContain('logical arguments');
      expect(instructions0).toContain('evidence');
      expect(instructions0).toContain('Avoid emotional appeals');
      expect(instructions1).toContain('logical');
      expect(instructions2).toContain('logical');
    });

    it('should return moderate rhetoric instructions for level 3-7', () => {
      const instructions3 = builder.getRhetoricInstructions(3);
      const instructions5 = builder.getRhetoricInstructions(5);
      const instructions7 = builder.getRhetoricInstructions(7);

      expect(instructions3).toContain('Blend');
      expect(instructions3).toContain('logical');
      expect(instructions5).toContain('Blend');
      expect(instructions7).toContain('Blend');
    });

    it('should include examples of rhetorical techniques for high rhetoric', () => {
      const instructions = builder.getRhetoricInstructions(9);

      expect(instructions).toContain('Examples');
      expect(instructions).toContain('Imagine a world where');
    });
  });

  describe('trait blending', () => {
    it('should include all four trait dimensions in prompt', () => {
      const basePrompt = 'Base prompt text';
      const personality: PersonalityProfile = {
        civility: 9,
        manner: 8,
        researchDepth: 7,
        rhetoricUsage: 6,
        tactics: []
      };

      const result = builder.addPersonalityInstructions(basePrompt, personality);

      expect(result).toContain('Civility Guidelines');
      expect(result).toContain('Manner Guidelines');
      expect(result).toContain('Research Guidelines');
      expect(result).toContain('Rhetoric Guidelines');
    });

    it('should blend high civility with low manner', () => {
      const basePrompt = 'Base prompt text';
      const personality: PersonalityProfile = {
        civility: 9,
        manner: 1,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const result = builder.addPersonalityInstructions(basePrompt, personality);

      expect(result).toContain('respectful');
      expect(result).toContain('sharp');
    });

    it('should blend low civility with high manner', () => {
      const basePrompt = 'Base prompt text';
      const personality: PersonalityProfile = {
        civility: 1,
        manner: 9,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const result = builder.addPersonalityInstructions(basePrompt, personality);

      expect(result).toContain('dismissive');
      expect(result).toContain('formal');
    });

    it('should blend high research with high rhetoric', () => {
      const basePrompt = 'Base prompt text';
      const personality: PersonalityProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 9,
        rhetoricUsage: 9,
        tactics: []
      };

      const result = builder.addPersonalityInstructions(basePrompt, personality);

      expect(result).toContain('Cite specific sources');
      expect(result).toContain('emotional appeals');
    });

    it('should blend low research with low rhetoric', () => {
      const basePrompt = 'Base prompt text';
      const personality: PersonalityProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 1,
        rhetoricUsage: 1,
        tactics: []
      };

      const result = builder.addPersonalityInstructions(basePrompt, personality);

      expect(result).toContain('general claims');
      expect(result).toContain('logical arguments');
    });
  });

  describe('tactic guidelines', () => {
    it('should add Gish Gallop instructions', () => {
      const basePrompt = 'Base prompt text';
      const result = builder.addTacticGuidelines(basePrompt, [DebateTactic.GISH_GALLOP]);

      expect(result).toContain('Gish Gallop');
      expect(result).toContain('multiple arguments');
      expect(result).toContain('rapid succession');
    });

    it('should add Strawman instructions', () => {
      const basePrompt = 'Base prompt text';
      const result = builder.addTacticGuidelines(basePrompt, [DebateTactic.STRAWMAN]);

      expect(result).toContain('Strawman');
      expect(result).toContain('misrepresent');
      expect(result).toContain('weaker or distorted form');
    });

    it('should add Ad Hominem instructions', () => {
      const basePrompt = 'Base prompt text';
      const result = builder.addTacticGuidelines(basePrompt, [DebateTactic.AD_HOMINEM]);

      expect(result).toContain('Ad Hominem');
      expect(result).toContain('credibility');
      expect(result).toContain('character');
    });

    it('should add Appeal to Emotion instructions', () => {
      const basePrompt = 'Base prompt text';
      const result = builder.addTacticGuidelines(basePrompt, [DebateTactic.APPEAL_TO_EMOTION]);

      expect(result).toContain('Appeal to Emotion');
      expect(result).toContain('emotional impact');
      expect(result).toContain('human consequences');
    });

    it('should add Appeal to Authority instructions', () => {
      const basePrompt = 'Base prompt text';
      const result = builder.addTacticGuidelines(basePrompt, [DebateTactic.APPEAL_TO_AUTHORITY]);

      expect(result).toContain('Appeal to Authority');
      expect(result).toContain('experts');
      expect(result).toContain('authorities');
    });

    it('should add False Dilemma instructions', () => {
      const basePrompt = 'Base prompt text';
      const result = builder.addTacticGuidelines(basePrompt, [DebateTactic.FALSE_DILEMMA]);

      expect(result).toContain('False Dilemma');
      expect(result).toContain('two possible options');
      expect(result).toContain('either/or');
    });

    it('should add Slippery Slope instructions', () => {
      const basePrompt = 'Base prompt text';
      const result = builder.addTacticGuidelines(basePrompt, [DebateTactic.SLIPPERY_SLOPE]);

      expect(result).toContain('Slippery Slope');
      expect(result).toContain('chain of events');
      expect(result).toContain('extreme consequences');
    });

    it('should add Red Herring instructions', () => {
      const basePrompt = 'Base prompt text';
      const result = builder.addTacticGuidelines(basePrompt, [DebateTactic.RED_HERRING]);

      expect(result).toContain('Red Herring');
      expect(result).toContain('irrelevant');
      expect(result).toContain('Divert attention');
    });

    it('should handle multiple tactics', () => {
      const basePrompt = 'Base prompt text';
      const tactics = [
        DebateTactic.GISH_GALLOP,
        DebateTactic.STRAWMAN,
        DebateTactic.AD_HOMINEM
      ];
      const result = builder.addTacticGuidelines(basePrompt, tactics);

      expect(result).toContain('Gish Gallop');
      expect(result).toContain('Strawman');
      expect(result).toContain('Ad Hominem');
    });

    it('should filter out NONE when combined with other tactics', () => {
      const basePrompt = 'Base prompt text';
      const tactics = [
        DebateTactic.NONE,
        DebateTactic.GISH_GALLOP
      ];
      const result = builder.addTacticGuidelines(basePrompt, tactics);

      expect(result).toContain('Gish Gallop');
      expect(result).not.toContain('Logical Argumentation Guidelines');
    });
  });

  describe('prompt construction with various personality combinations', () => {
    it('should construct prompt for academic scholar personality', () => {
      const personality: PersonalityProfile = {
        civility: 9,
        manner: 9,
        researchDepth: 9,
        rhetoricUsage: 2,
        tactics: [DebateTactic.NONE]
      };

      const prompt = builder.buildDebaterPrompt(
        Position.AFFIRMATIVE,
        personality,
        [DebateTactic.NONE]
      );

      expect(prompt).toContain('respectful');
      expect(prompt).toContain('formal');
      expect(prompt).toContain('Cite specific sources');
      expect(prompt).toContain('logical arguments');
      expect(prompt).toContain('Logical Argumentation Guidelines');
    });

    it('should construct prompt for aggressive debater personality', () => {
      const personality: PersonalityProfile = {
        civility: 1,
        manner: 1,
        researchDepth: 2,
        rhetoricUsage: 8,
        tactics: [DebateTactic.AD_HOMINEM, DebateTactic.GISH_GALLOP]
      };

      const prompt = builder.buildDebaterPrompt(
        Position.NEGATIVE,
        personality,
        [DebateTactic.AD_HOMINEM, DebateTactic.GISH_GALLOP]
      );

      expect(prompt).toContain('dismissive');
      expect(prompt).toContain('sharp');
      expect(prompt).toContain('general claims');
      expect(prompt).toContain('emotional appeals');
      expect(prompt).toContain('Ad Hominem');
      expect(prompt).toContain('Gish Gallop');
    });

    it('should construct prompt for balanced debater personality', () => {
      const personality: PersonalityProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const prompt = builder.buildDebaterPrompt(
        Position.AFFIRMATIVE,
        personality,
        []
      );

      expect(prompt).toContain('Balance respect with assertiveness');
      expect(prompt).toContain('conversational but firm');
      expect(prompt).toContain('Balance');
      expect(prompt).toContain('Blend');
    });

    it('should construct prompt with custom instructions', () => {
      const personality: PersonalityProfile = {
        civility: 7,
        manner: 6,
        researchDepth: 8,
        rhetoricUsage: 4,
        tactics: [DebateTactic.APPEAL_TO_AUTHORITY],
        customInstructions: 'Focus on economic impacts and cite recent studies from 2023-2024'
      };

      const prompt = builder.buildDebaterPrompt(
        Position.NEGATIVE,
        personality,
        [DebateTactic.APPEAL_TO_AUTHORITY]
      );

      expect(prompt).toContain('Focus on economic impacts');
      expect(prompt).toContain('2023-2024');
      expect(prompt).toContain('Appeal to Authority');
    });
  });

  describe('calculatePreparationTime', () => {
    it('should increase preparation time for high research depth', () => {
      const baseTime = 60;
      const result = PromptBuilder.calculatePreparationTime(baseTime, 9);

      expect(result).toBe(90); // 1.5x base time
    });

    it('should decrease preparation time for low research depth', () => {
      const baseTime = 60;
      const result = PromptBuilder.calculatePreparationTime(baseTime, 1);

      expect(result).toBe(48); // 0.8x base time
    });

    it('should maintain base preparation time for moderate research depth', () => {
      const baseTime = 60;
      const result = PromptBuilder.calculatePreparationTime(baseTime, 5);

      expect(result).toBe(60); // 1.0x base time
    });

    it('should handle edge case at research depth 8', () => {
      const baseTime = 100;
      const result = PromptBuilder.calculatePreparationTime(baseTime, 8);

      expect(result).toBe(150); // 1.5x base time
    });

    it('should handle edge case at research depth 2', () => {
      const baseTime = 100;
      const result = PromptBuilder.calculatePreparationTime(baseTime, 2);

      expect(result).toBe(80); // 0.8x base time
    });

    it('should handle edge case at research depth 3', () => {
      const baseTime = 100;
      const result = PromptBuilder.calculatePreparationTime(baseTime, 3);

      expect(result).toBe(100); // 1.0x base time
    });

    it('should handle edge case at research depth 7', () => {
      const baseTime = 100;
      const result = PromptBuilder.calculatePreparationTime(baseTime, 7);

      expect(result).toBe(100); // 1.0x base time
    });
  });
});
