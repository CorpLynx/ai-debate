# Design Document: AI Debate System - Advanced Features

## Overview

This design extends the base AI Debate System with three major enhancements: a moderator AI model that manages debate proceedings and enforces rules, a personality system that allows dynamic configuration of debater behavior and argumentation styles, and a system prompt framework that ensures AI models operate within their assigned constraints. These features transform the debate system from a simple back-and-forth exchange into a rich, dynamic experience with diverse personalities and professional moderation.

## Architecture

The advanced features integrate into the existing debate system architecture with new components:

```
┌─────────────────────────────────────────────────────────┐
│                    CLI Interface                         │
│         (User Input/Output + Personality UI)             │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│              Enhanced Debate Orchestrator                │
│    (State Management + Moderator Integration)            │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┬──────────────┐
        │                 │                 │              │
┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐  ┌────▼─────┐
│   AI Model   │  │  Moderator  │  │ Personality │  │  Prompt  │
│   Provider   │  │   Manager   │  │  Generator  │  │ Builder  │
│   Interface  │  │             │  │             │  │          │
└──────────────┘  └─────────────┘  └─────────────┘  └──────────┘
        │                 │                 │              │
        └─────────────────┴─────────────────┴──────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│              Model Implementations                       │
│     (OpenAI, Anthropic, Local Models, etc.)             │
└─────────────────────────────────────────────────────────┘
```

### Key Architectural Additions

1. **Moderator Manager**: Coordinates moderator AI interactions and interventions
2. **Personality Generator**: Creates and manages debater personality profiles
3. **Prompt Builder**: Constructs system prompts incorporating personality traits and constraints
4. **Enhanced Orchestrator**: Integrates moderator flow into debate rounds

## Components and Interfaces

### 1. Moderator Manager

Manages the moderator AI model and coordinates its interactions with the debate.

**Responsibilities:**
- Initialize moderator with debate rules and format
- Prompt moderator for round introductions and commentary
- Submit debater statements for moderator review
- Process moderator interventions and rule violation reports
- Generate final debate summary from moderator

**Key Methods:**
```typescript
interface ModeratorManager {
  initializeModerator(debate: Debate, moderatorModel: AIModelProvider): ModeratorContext
  introduceRound(roundType: RoundType, context: ModeratorContext): Promise<string>
  reviewStatement(statement: Statement, context: ModeratorContext): Promise<ModeratorReview>
  provideRoundCommentary(round: DebateRound, context: ModeratorContext): Promise<string>
  generateDebateSummary(debate: Debate, context: ModeratorContext): Promise<string>
  escalateIntervention(violations: RuleViolation[], context: ModeratorContext): Promise<ModeratorIntervention>
}
```

### 2. Personality Generator

Creates and manages personality profiles for debaters.

**Responsibilities:**
- Generate random personality profiles with coherent trait combinations
- Validate personality profile configurations
- Save and load personality profiles
- Provide personality trait descriptions for display

**Key Methods:**
```typescript
interface PersonalityGenerator {
  generateRandom(): PersonalityProfile
  validateProfile(profile: PersonalityProfile): ValidationResult
  saveProfile(name: string, profile: PersonalityProfile): Promise<void>
  loadProfile(name: string): Promise<PersonalityProfile>
  listProfiles(): Promise<ProfileSummary[]>
  getDefaultProfile(): PersonalityProfile
}
```

### 3. Prompt Builder

Constructs system prompts that incorporate personality traits and behavioral constraints.

**Responsibilities:**
- Build base system prompts for debaters and moderator
- Inject personality trait instructions into prompts
- Add debate tactic guidelines to prompts
- Ensure prompts maintain consistency across rounds
- Generate constraint reminders for context

**Key Methods:**
```typescript
interface PromptBuilder {
  buildDebaterPrompt(position: Position, personality: PersonalityProfile, tactics: DebateTactic[]): string
  buildModeratorPrompt(strictness: ModeratorStrictness, rules: DebateRules): string
  addPersonalityInstructions(basePrompt: string, personality: PersonalityProfile): string
  addTacticGuidelines(basePrompt: string, tactics: DebateTactic[]): string
  buildContextReminder(personality: PersonalityProfile): string
}
```

### 4. Enhanced Debate Orchestrator

Extends the base orchestrator to integrate moderator interactions.

**Additional Responsibilities:**
- Coordinate moderator round introductions
- Submit statements for moderator review
- Process and display moderator interventions
- Include moderator commentary in debate flow
- Track rule violations per debater

**New Methods:**
```typescript
interface EnhancedDebateOrchestrator extends DebateOrchestrator {
  executeRoundWithModerator(roundType: RoundType, debate: Debate): Promise<Debate>
  processModeratorReview(statement: Statement, debate: Debate): Promise<ModeratorReview>
  handleModeratorIntervention(intervention: ModeratorIntervention, debate: Debate): Debate
  trackRuleViolation(violation: RuleViolation, debater: Position, debate: Debate): Debate
}
```

## Data Models

### PersonalityProfile
```typescript
interface PersonalityProfile {
  name?: string
  civility: CivilityLevel        // 0-10: hostile to respectful
  manner: MannerLevel            // 0-10: abrasive to well-mannered
  researchDepth: ResearchLevel   // 0-10: superficial to well-researched
  rhetoricUsage: RhetoricLevel   // 0-10: pure logic to heavy rhetoric
  tactics: DebateTactic[]        // specific tactics to employ
  customInstructions?: string    // additional personality notes
}

type CivilityLevel = number      // 0 = hostile, 5 = balanced, 10 = respectful
type MannerLevel = number        // 0 = abrasive, 5 = conversational, 10 = formal
type ResearchLevel = number      // 0 = superficial, 5 = moderate, 10 = academic
type RhetoricLevel = number      // 0 = pure logic, 5 = balanced, 10 = heavy rhetoric
```

### DebateTactic
```typescript
enum DebateTactic {
  GISH_GALLOP = 'gish_gallop',           // rapid-fire multiple arguments
  STRAWMAN = 'strawman',                  // misrepresent then refute
  AD_HOMINEM = 'ad_hominem',             // attack character/credibility
  APPEAL_TO_EMOTION = 'appeal_to_emotion', // emphasize emotional impact
  APPEAL_TO_AUTHORITY = 'appeal_to_authority', // cite authorities
  FALSE_DILEMMA = 'false_dilemma',       // present only two options
  SLIPPERY_SLOPE = 'slippery_slope',     // chain of consequences
  RED_HERRING = 'red_herring',           // introduce irrelevant topics
  NONE = 'none'                          // avoid fallacious tactics
}
```

### ModeratorContext
```typescript
interface ModeratorContext {
  moderatorModel: AIModelProvider
  strictness: ModeratorStrictness
  rules: DebateRules
  violationHistory: Map<Position, RuleViolation[]>
  interventionCount: Map<Position, number>
}

enum ModeratorStrictness {
  LENIENT = 'lenient',      // only major violations
  MODERATE = 'moderate',    // balanced enforcement
  STRICT = 'strict'         // all violations
}
```

### DebateRules
```typescript
interface DebateRules {
  stayOnTopic: boolean
  noPersonalAttacks: boolean
  citeSources: boolean
  timeLimit: number
  wordLimit: number
  allowedTactics: DebateTactic[]
  forbiddenTactics: DebateTactic[]
}
```

### ModeratorReview
```typescript
interface ModeratorReview {
  statement: Statement
  violations: RuleViolation[]
  tacticsIdentified: TacticIdentification[]
  fallaciesDetected: FallacyDetection[]
  requiresIntervention: boolean
  commentary?: string
}
```

### RuleViolation
```typescript
interface RuleViolation {
  rule: string
  severity: ViolationSeverity
  explanation: string
  timestamp: Date
}

enum ViolationSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major'
}
```

### ModeratorIntervention
```typescript
interface ModeratorIntervention {
  type: InterventionType
  target: Position
  message: string
  timestamp: Date
}

enum InterventionType {
  WARNING = 'warning',
  CORRECTION = 'correction',
  PENALTY = 'penalty'
}
```

### TacticIdentification
```typescript
interface TacticIdentification {
  tactic: DebateTactic
  description: string
  effectiveness: string  // moderator's assessment
}
```

### FallacyDetection
```typescript
interface FallacyDetection {
  fallacyType: string
  explanation: string
  severity: ViolationSeverity
}
```

### Enhanced Debate Model
```typescript
interface EnhancedDebate extends Debate {
  moderatorEnabled: boolean
  moderatorModel?: AIModelProvider
  moderatorContext?: ModeratorContext
  affirmativePersonality: PersonalityProfile
  negativePersonality: PersonalityProfile
  moderatorCommentary: ModeratorCommentary[]
  ruleViolations: Map<Position, RuleViolation[]>
  interventions: ModeratorIntervention[]
}
```

### ModeratorCommentary
```typescript
interface ModeratorCommentary {
  roundType: RoundType
  introduction?: string
  roundSummary?: string
  tacticalAnalysis?: TacticIdentification[]
  fallacyReport?: FallacyDetection[]
  timestamp: Date
}
```

### ProfileSummary
```typescript
interface ProfileSummary {
  name: string
  description: string  // auto-generated from traits
  traits: {
    civility: CivilityLevel
    manner: MannerLevel
    researchDepth: ResearchLevel
    rhetoricUsage: RhetoricLevel
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Moderator model selection when enabled
*For any* debate configuration with moderator enabled, the system should select exactly three AI models (two debaters and one moderator).
**Validates: Requirements 1.1**

### Property 2: Moderator receives rules and format
*For any* moderator initialization, the moderator's system prompt should include debate rules and format instructions.
**Validates: Requirements 1.2**

### Property 3: Moderator introduces each round
*For any* debate round with moderator enabled, the moderator should be prompted to introduce the round before debaters speak.
**Validates: Requirements 1.3**

### Property 4: Moderator provides round commentary
*For any* completed debate round with moderator enabled, the moderator should be prompted to provide commentary after both debaters have spoken.
**Validates: Requirements 1.4**

### Property 5: Moderator provides debate summary
*For any* completed debate with moderator enabled, the moderator should be prompted to provide a final summary.
**Validates: Requirements 1.5**

### Property 6: Statements submitted for moderator review
*For any* debater statement generated with moderator enabled, the statement should be passed to the moderator review function.
**Validates: Requirements 2.1**

### Property 7: Rule violations are recorded
*For any* moderator review that identifies violations, all violations should be recorded in the debate state with the moderator's explanation.
**Validates: Requirements 2.2**

### Property 8: Violations trigger intervention prompts
*For any* detected rule violation, the moderator should be prompted to issue a warning or intervention.
**Validates: Requirements 2.3**

### Property 9: Violation escalation with history
*For any* debater with multiple violations, the moderator should be provided with violation history when prompted for intervention.
**Validates: Requirements 2.4**

### Property 10: Interventions are displayed
*For any* moderator intervention, the intervention should be included in the output displayed to the user.
**Validates: Requirements 2.5**

### Property 11: Personality profile applied to system prompt
*For any* debater with a specified personality profile, the debater's system prompt should include instructions derived from all personality traits in the profile.
**Validates: Requirements 3.1, 3.2, 12.1, 12.2**

### Property 12: Default personality when none specified
*For any* debater without a specified personality profile, the system should apply a neutral default personality profile.
**Validates: Requirements 3.3**

### Property 13: Invalid personality profiles rejected
*For any* personality profile with out-of-range trait values or invalid tactics, the validation function should reject the profile and return an error message.
**Validates: Requirements 3.4**

### Property 14: Random personality generation produces valid profiles
*For any* randomly generated personality profile, the profile should pass validation and contain values for all required dimensions (civility, manner, researchDepth, rhetoricUsage).
**Validates: Requirements 4.1, 4.2, 4.4**

### Property 15: Generated personalities displayed before debate
*For any* debate using randomly generated personalities, the profiles should be displayed to the user before the debate begins.
**Validates: Requirements 4.3**

### Property 16: Civility trait affects prompt instructions
*For any* personality profile, the system prompt should include language guidelines that correspond to the civility level: respectful language for high civility, dismissive language for low civility, and balanced language for moderate civility.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 17: Manner trait affects prompt instructions
*For any* personality profile, the system prompt should include manner guidelines that correspond to the manner level: formal language for well-mannered, sharp language for abrasive, and conversational language for moderate.
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 18: Multiple traits blended in prompt
*For any* personality profile with both civility and manner traits, the system prompt should include instructions from both trait dimensions.
**Validates: Requirements 6.4**

### Property 19: Research depth affects prompt and preparation time
*For any* personality profile with high research depth, the system prompt should include instructions to cite sources and use data, and the preparation time should be increased.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 20: Rhetoric usage affects prompt instructions
*For any* personality profile, the system prompt should include rhetoric guidelines that correspond to the rhetoric level: logical arguments for low rhetoric, emotional appeals for high rhetoric, and balanced approach for moderate.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 21: Debate tactics included in prompt
*For any* personality profile with specified debate tactics, the system prompt should include instructions for each tactic in the tactics list.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 22: Moderator identifies fallacies and tactics
*For any* moderator review, the moderator should be prompted to identify logical fallacies and debate tactics used in the statement.
**Validates: Requirements 10.1, 10.2**

### Property 23: Fallacy and tactic identifications in commentary
*For any* moderator review that identifies fallacies or tactics, those identifications should be included in the moderator's commentary.
**Validates: Requirements 10.3**

### Property 24: Violations and observations distinguished
*For any* moderator commentary containing both rule violations and tactical observations, the display should clearly distinguish between the two types.
**Validates: Requirements 10.4**

### Property 25: Personality profile storage round-trip
*For any* personality profile, saving it with a name and then loading it should return a profile with identical trait values.
**Validates: Requirements 11.1, 11.3**

### Property 26: Saved profiles available for selection
*For any* saved personality profile, it should appear in the list of available profiles when starting a new debate.
**Validates: Requirements 11.2, 11.4**

### Property 27: Personality reminders in context
*For any* debater with a personality profile, the context provided for each statement generation should include reminders of the personality traits.
**Validates: Requirements 12.3**

### Property 28: Personality profiles in transcript
*For any* completed debate, the transcript should include the personality profiles used by both debaters.
**Validates: Requirements 12.4**

### Property 29: Moderator strictness affects prompt
*For any* moderator configuration, the moderator's system prompt should include strictness guidelines that correspond to the strictness level: intervene on minor violations for strict, only major violations for lenient, and balanced for moderate.
**Validates: Requirements 13.1, 13.2, 13.3, 13.4**

### Property 30: Moderator commentary includes required elements
*For any* moderator round commentary, the moderator should be prompted to evaluate argument strength, identify effective techniques, and note missed opportunities.
**Validates: Requirements 14.1, 14.2, 14.3**

### Property 31: Moderator provides overall assessment
*For any* completed debate with moderator enabled, the moderator's final summary should include an overall assessment of both debaters' performance.
**Validates: Requirements 14.4**

### Property 32: Moderator disabled behavior
*For any* debate with moderator disabled, the system should select only two AI models, conduct rounds without moderator prompts, and produce no moderator interventions or commentary.
**Validates: Requirements 15.1, 15.2, 15.3**

### Property 33: Moderator configuration validated
*For any* change to moderator settings, the configuration should be validated and the user should be notified of the resulting debate format.
**Validates: Requirements 15.4**

## Error Handling

The advanced features introduce additional error scenarios:

### 1. Personality Validation Errors
- **Out-of-range trait values**: Reject profiles with values outside 0-10 range
- **Invalid tactics**: Reject profiles with unrecognized tactic names
- **Incoherent combinations**: Warn about unusual trait combinations (e.g., high research + heavy rhetoric)
- **Missing required fields**: Reject profiles missing core dimensions

### 2. Moderator Errors
- **Moderator model unavailable**: Fall back to unmoderated debate and notify user
- **Moderator response failures**: Log error, continue debate without that moderator interaction
- **Invalid moderator reviews**: Log warning, continue without intervention
- **Moderator timeout**: Skip that moderator interaction, continue debate

### 3. Profile Storage Errors
- **Save failures**: Notify user, allow retry or continue without saving
- **Load failures**: Notify user, offer default profile or profile selection
- **Duplicate names**: Prompt user to overwrite or choose new name
- **Corrupted profile data**: Reject profile, notify user, offer default

### 4. Prompt Construction Errors
- **Template errors**: Log error, use fallback prompt template
- **Trait injection failures**: Log warning, use base prompt without trait
- **Prompt too long**: Truncate or simplify, log warning

## Testing Strategy

The advanced features will be tested using the same dual approach as the base system: property-based tests and unit tests.

### Property-Based Testing

We will continue using **fast-check** with a minimum of 100 iterations per test.

**Key Property Tests:**

1. **Moderator integration** (Properties 1-10): Generate debates with/without moderator, verify correct model selection, prompt sequencing, and intervention handling

2. **Personality validation** (Properties 13, 14): Generate random personality profiles including invalid ones, verify validation logic

3. **Prompt construction** (Properties 11, 16-21): Generate various personality profiles, verify prompts contain correct instructions for each trait and tactic

4. **Profile persistence** (Properties 25, 26): Generate random profiles, test save/load round-trip

5. **Consistency** (Properties 11, 27): Generate debates with personalities, verify personality instructions appear in all prompts and contexts

6. **Moderator behavior** (Properties 29-32): Generate debates with different moderator configurations, verify correct behavior

7. **Transcript completeness** (Property 28): Generate debates with personalities, verify personalities in transcript

### Unit Testing

**Core Unit Tests:**

1. **PersonalityGenerator**: Test random generation, validation, save/load operations
2. **PromptBuilder**: Test prompt construction with various personality combinations
3. **ModeratorManager**: Test moderator initialization, review processing, intervention handling
4. **Enhanced Orchestrator**: Test moderator integration into debate flow

**Edge Cases:**
- Extreme personality values (all 0s, all 10s)
- Empty tactics list vs. full tactics list
- Moderator disabled mid-debate (configuration change)
- Conflicting personality traits
- Very long custom instructions
- Profile name collisions

**Integration Tests:**
- Full debate with moderator and custom personalities
- Moderator intervention scenarios
- Profile save/load/reuse across multiple debates
- Transition from unmoderated to moderated debate format

### Test Organization

```
tests/
├── unit/
│   ├── personality-generator.test.ts
│   ├── prompt-builder.test.ts
│   ├── moderator-manager.test.ts
│   └── enhanced-orchestrator.test.ts
├── properties/
│   ├── moderator-integration.property.test.ts
│   ├── personality-validation.property.test.ts
│   ├── prompt-construction.property.test.ts
│   ├── profile-persistence.property.test.ts
│   └── moderator-behavior.property.test.ts
└── integration/
    ├── moderated-debate.test.ts
    ├── personality-debate.test.ts
    └── profile-management.test.ts
```

## Implementation Considerations

### 1. Prompt Engineering for Personalities

**Trait Translation:**
- Each trait value (0-10) maps to specific language in prompts
- Use templates with trait-specific sections
- Combine multiple traits without conflicts
- Keep prompts concise while being specific

**Example Civility Mapping:**
```typescript
function getCivilityInstructions(level: number): string {
  if (level >= 8) return "Be respectful and acknowledge valid opposing points..."
  if (level >= 4) return "Balance respect with assertiveness..."
  return "Challenge opponents aggressively and dismiss weak arguments..."
}
```

### 2. Moderator Prompt Design

**Moderator System Prompt Structure:**
```
You are a debate moderator. Your responsibilities:
1. Introduce each round
2. Review statements for rule violations
3. Identify debate tactics and fallacies
4. Provide insightful commentary
5. Maintain debate flow

Rules to enforce: [rules]
Strictness level: [strictness]
```

**Review Prompt Structure:**
```
Review this statement:
[statement]

Identify:
- Rule violations (if any)
- Debate tactics used
- Logical fallacies (if any)
- Argument effectiveness
```

### 3. Personality Profile Presets

**Provide Common Presets:**
- "Academic Scholar": High research, low rhetoric, high civility, formal manner
- "Firebrand Activist": Low research, high rhetoric, low civility, abrasive manner
- "Politician": Moderate research, high rhetoric, moderate civility, well-mannered
- "Skeptical Scientist": High research, low rhetoric, moderate civility, conversational manner
- "Internet Troll": Low research, high rhetoric, low civility, abrasive manner + ad hominem

### 4. Moderator Intervention Levels

**Escalation Strategy:**
```typescript
function determineInterventionType(
  violationCount: number,
  severity: ViolationSeverity
): InterventionType {
  if (severity === 'MAJOR') return 'PENALTY'
  if (violationCount >= 3) return 'PENALTY'
  if (violationCount >= 1) return 'CORRECTION'
  return 'WARNING'
}
```

### 5. Performance Considerations

**Moderator Overhead:**
- Moderator adds 3-5 additional AI calls per round
- Consider async processing where possible
- Cache moderator reviews for replay
- Allow skipping moderator for faster debates

**Prompt Size:**
- Personality instructions add 100-300 tokens per prompt
- Monitor total prompt size, truncate if needed
- Prioritize recent context over personality reminders

### 6. User Experience

**Personality Selection UI:**
```
Select personality for Affirmative debater:
1. Use preset profile
2. Create custom profile
3. Generate random profile
4. Load saved profile
```

**Moderator Commentary Display:**
```
[MODERATOR] Round 1 Introduction:
Welcome to this debate on [topic]...

[AFFIRMATIVE - GPT-4] Opening Statement:
[statement]

[MODERATOR] Review:
✓ No rule violations
⚠ Tactic identified: Appeal to authority
💡 Strong opening, effective use of evidence

[NEGATIVE - Claude] Opening Statement:
[statement]

[MODERATOR] Review:
⚠ Minor violation: Off-topic digression
⚠ Tactic identified: Strawman argument
💡 Weak response to core argument
```

### 7. Configuration Management

**Extended Configuration:**
```typescript
interface AdvancedDebateConfig extends DebateConfig {
  moderatorEnabled: boolean
  moderatorStrictness: ModeratorStrictness
  affirmativePersonality: PersonalityProfile | 'random' | 'default'
  negativePersonality: PersonalityProfile | 'random' | 'default'
  allowedTactics: DebateTactic[]
  forbiddenTactics: DebateTactic[]
}
```

### 8. Extensibility

**Custom Personality Dimensions:**
- Allow plugins to add new personality dimensions
- Support custom trait mappings to prompt instructions
- Enable user-defined debate tactics

**Moderator Customization:**
- Allow custom moderator prompts
- Support different moderator styles (strict, lenient, analytical, entertaining)
- Enable moderator personality profiles

## Integration with Base System

### Backward Compatibility

- All base system features continue to work without advanced features
- Moderator and personalities are optional enhancements
- Default behavior matches base system when advanced features disabled

### Migration Path

1. **Phase 1 Complete**: Base debate system fully functional
2. **Add Personality System**: Introduce personality profiles, keep moderator disabled
3. **Add Moderator**: Enable moderator with basic functionality
4. **Full Integration**: All advanced features working together

### Shared Components

- Both systems use same AIModelProvider interface
- Transcript format extended to include new metadata
- Configuration system extended, not replaced
- CLI interface enhanced with new options

## Future Enhancements

Potential features for future iterations:

1. **Audience Reactions**: Simulate audience responses to arguments
2. **Fact-Checking Integration**: Moderator verifies factual claims
3. **Argument Mapping**: Visual representation of argument structure
4. **Personality Evolution**: Debaters adapt personality based on opponent
5. **Multi-Moderator Panels**: Multiple moderators with different perspectives
6. **Debate Coaching**: AI coach provides real-time suggestions
7. **Historical Personality Emulation**: Debate in the style of famous debaters
8. **Emotional Intelligence**: Track and respond to emotional tone
9. **Cultural Adaptation**: Adjust debate style for different cultural contexts
10. **Learning Mode**: Moderator provides educational commentary on techniques

## Security and Safety Considerations

### 1. Toxic Personality Prevention

- Validate that low civility doesn't produce hate speech
- Monitor generated content for harmful language
- Provide content warnings for hostile debates
- Allow users to set toxicity limits

### 2. Moderator Bias

- Ensure moderator doesn't favor one position
- Randomize moderator model selection
- Log moderator decisions for bias analysis
- Allow users to challenge moderator rulings

### 3. Prompt Injection

- Sanitize custom personality instructions
- Validate that personality traits don't override core constraints
- Prevent users from injecting malicious prompts
- Isolate personality instructions from system prompts

### 4. Resource Limits

- Cap number of moderator interventions per debate
- Limit personality profile storage per user
- Enforce maximum prompt sizes
- Prevent infinite escalation loops

## Deployment

**Additional Dependencies:**
- Profile storage (JSON files or database)
- Extended configuration schema
- Additional AI model quota for moderator

**Configuration Files:**
```
~/.ai-debate/
├── config.json (extended with advanced features)
├── profiles/
│   ├── academic-scholar.json
│   ├── firebrand-activist.json
│   └── custom-profiles/
└── moderator-rules.json
```

**CLI Extensions:**
```bash
# With moderator and random personalities
ai-debate "Should AI be regulated?" --moderator --random-personalities

# With custom personalities
ai-debate "Climate change policy" --aff-personality scholar --neg-personality activist

# With specific tactics
ai-debate "Economic policy" --aff-tactics gish_gallop --neg-tactics strawman

# Strict moderator
ai-debate "Healthcare reform" --moderator --strictness strict
```
