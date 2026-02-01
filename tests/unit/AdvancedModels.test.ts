import {
  DebateTactic,
  PersonalityProfile,
  ModeratorStrictness,
  DebateRules,
  RuleViolation,
  ViolationSeverity,
  ModeratorIntervention,
  InterventionType,
  TacticIdentification,
  FallacyDetection,
  ModeratorReview,
  ModeratorContext,
  ModeratorCommentary,
  ProfileSummary,
  EnhancedDebate,
  Position,
  DEFAULT_CONFIG
} from '../../src/models';

describe('Advanced Data Models', () => {
  describe('DebateTactic', () => {
    it('should have all expected tactics', () => {
      expect(DebateTactic.GISH_GALLOP).toBe('gish_gallop');
      expect(DebateTactic.STRAWMAN).toBe('strawman');
      expect(DebateTactic.AD_HOMINEM).toBe('ad_hominem');
      expect(DebateTactic.APPEAL_TO_EMOTION).toBe('appeal_to_emotion');
      expect(DebateTactic.APPEAL_TO_AUTHORITY).toBe('appeal_to_authority');
      expect(DebateTactic.FALSE_DILEMMA).toBe('false_dilemma');
      expect(DebateTactic.SLIPPERY_SLOPE).toBe('slippery_slope');
      expect(DebateTactic.RED_HERRING).toBe('red_herring');
      expect(DebateTactic.NONE).toBe('none');
    });
  });

  describe('PersonalityProfile', () => {
    it('should create a valid personality profile', () => {
      const profile: PersonalityProfile = {
        name: 'Test Profile',
        civility: 5,
        manner: 7,
        researchDepth: 8,
        rhetoricUsage: 3,
        tactics: [DebateTactic.NONE],
        customInstructions: 'Be thoughtful'
      };

      expect(profile.civility).toBe(5);
      expect(profile.manner).toBe(7);
      expect(profile.researchDepth).toBe(8);
      expect(profile.rhetoricUsage).toBe(3);
      expect(profile.tactics).toContain(DebateTactic.NONE);
    });
  });

  describe('ModeratorStrictness', () => {
    it('should have all strictness levels', () => {
      expect(ModeratorStrictness.LENIENT).toBe('lenient');
      expect(ModeratorStrictness.MODERATE).toBe('moderate');
      expect(ModeratorStrictness.STRICT).toBe('strict');
    });
  });

  describe('DebateRules', () => {
    it('should create valid debate rules', () => {
      const rules: DebateRules = {
        stayOnTopic: true,
        noPersonalAttacks: true,
        citeSources: false,
        timeLimit: 120,
        wordLimit: 500,
        allowedTactics: [DebateTactic.NONE],
        forbiddenTactics: [DebateTactic.AD_HOMINEM]
      };

      expect(rules.stayOnTopic).toBe(true);
      expect(rules.allowedTactics).toContain(DebateTactic.NONE);
      expect(rules.forbiddenTactics).toContain(DebateTactic.AD_HOMINEM);
    });
  });

  describe('RuleViolation', () => {
    it('should create a valid rule violation', () => {
      const violation: RuleViolation = {
        rule: 'No personal attacks',
        severity: ViolationSeverity.MAJOR,
        explanation: 'Debater attacked opponent character',
        timestamp: new Date()
      };

      expect(violation.severity).toBe(ViolationSeverity.MAJOR);
      expect(violation.rule).toBe('No personal attacks');
    });
  });

  describe('ModeratorIntervention', () => {
    it('should create a valid intervention', () => {
      const intervention: ModeratorIntervention = {
        type: InterventionType.WARNING,
        target: Position.AFFIRMATIVE,
        message: 'Please stay on topic',
        timestamp: new Date()
      };

      expect(intervention.type).toBe(InterventionType.WARNING);
      expect(intervention.target).toBe(Position.AFFIRMATIVE);
    });
  });

  describe('TacticIdentification', () => {
    it('should create a valid tactic identification', () => {
      const tactic: TacticIdentification = {
        tactic: DebateTactic.STRAWMAN,
        description: 'Misrepresented opponent argument',
        effectiveness: 'Moderately effective'
      };

      expect(tactic.tactic).toBe(DebateTactic.STRAWMAN);
    });
  });

  describe('FallacyDetection', () => {
    it('should create a valid fallacy detection', () => {
      const fallacy: FallacyDetection = {
        fallacyType: 'Ad Hominem',
        explanation: 'Attacked character instead of argument',
        severity: ViolationSeverity.MODERATE
      };

      expect(fallacy.fallacyType).toBe('Ad Hominem');
      expect(fallacy.severity).toBe(ViolationSeverity.MODERATE);
    });
  });

  describe('DebateConfig', () => {
    it('should include advanced feature fields in DEFAULT_CONFIG', () => {
      expect(DEFAULT_CONFIG.moderatorEnabled).toBe(false);
      expect(DEFAULT_CONFIG.moderatorStrictness).toBe(ModeratorStrictness.MODERATE);
      expect(DEFAULT_CONFIG.affirmativePersonality).toBe('default');
      expect(DEFAULT_CONFIG.negativePersonality).toBe('default');
      expect(DEFAULT_CONFIG.allowedTactics).toEqual([]);
      expect(DEFAULT_CONFIG.forbiddenTactics).toEqual([]);
    });
  });
});
