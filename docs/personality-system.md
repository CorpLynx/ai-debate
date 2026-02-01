# Personality System Documentation

## Overview

The AI Debate System includes a sophisticated personality system that allows debaters to exhibit diverse behavioral characteristics and argumentation styles. Each debater is assigned a personality profile that influences their language, tone, research depth, rhetorical approach, and debate tactics.

## Personality Dimensions

The personality system is built on four core dimensions, each rated on a scale from 0 to 10:

### 1. Civility (0-10)

Controls how respectful or hostile a debater's tone is toward their opponent.

**Scale:**
- **0-2 (Hostile)**: Dismissive language, aggressive challenges, minimal acknowledgment of opposing points
- **3-7 (Balanced)**: Mix of respect and assertiveness, challenges arguments while maintaining professionalism
- **8-10 (Respectful)**: Courteous language, acknowledges valid opposing points, focuses on ideas rather than attacks

**Example Behaviors:**
- **Low Civility (2)**: "That's a ridiculous argument that completely ignores reality."
- **Moderate Civility (5)**: "While I understand your perspective, I must respectfully disagree."
- **High Civility (9)**: "You raise an excellent point about X, though I'd like to offer an alternative view on Y."

### 2. Manner (0-10)

Controls the formality and sharpness of a debater's communication style.

**Scale:**
- **0-2 (Abrasive)**: Sharp, confrontational language with direct attacks on arguments
- **3-7 (Conversational)**: Firm but approachable language, balanced between formal and casual
- **8-10 (Well-Mannered)**: Formal, polished language that avoids any personal edge

**Example Behaviors:**
- **Low Manner (2)**: "Let me be blunt: your position falls apart under scrutiny."
- **Moderate Manner (5)**: "I think we need to examine this claim more carefully."
- **High Manner (9)**: "I would humbly suggest that further consideration of this matter reveals certain complexities."

### 3. Research Depth (0-10)

Controls how much evidence, data, and citations a debater uses in their arguments.

**Scale:**
- **0-2 (Superficial)**: General claims, common knowledge, minimal evidence
- **3-7 (Moderate)**: Balance of evidence with broader arguments, selective citations
- **8-10 (Academic)**: Extensive citations, detailed data, rigorous evidence standards

**Example Behaviors:**
- **Low Research (2)**: "Everyone knows that this policy doesn't work."
- **Moderate Research (5)**: "Studies have shown mixed results on this approach."
- **High Research (9)**: "According to Smith et al. (2023) in the Journal of Policy Analysis, the implementation of this policy in 15 countries showed a 23% improvement in outcomes (p < 0.05)."

**Note:** High research depth automatically increases preparation time to allow for more thorough research.

### 4. Rhetoric Usage (0-10)

Controls the balance between logical argumentation and persuasive rhetorical techniques.

**Scale:**
- **0-2 (Pure Logic)**: Focus on facts, data, and logical reasoning with minimal emotional appeal
- **3-7 (Balanced)**: Mix of logical arguments with some persuasive elements
- **8-10 (Heavy Rhetoric)**: Emotional appeals, analogies, metaphors, and persuasive storytelling

**Example Behaviors:**
- **Low Rhetoric (2)**: "The data shows a clear correlation between X and Y, therefore Z follows."
- **Moderate Rhetoric (5)**: "Consider the implications: if we allow X, we're essentially choosing between two futures."
- **High Rhetoric (9)**: "Imagine a world where children grow up without access to this fundamental right. Picture the faces of those who will suffer if we fail to act today."

## Debate Tactics

In addition to the four core dimensions, debaters can be assigned specific debate tactics that influence their argumentation strategies:

### Available Tactics

#### 1. GISH_GALLOP
**Description:** Present multiple arguments rapidly, overwhelming the opponent with quantity rather than quality.

**Behavior:** Debater will make numerous claims in quick succession, making it difficult for the opponent to address each one individually.

**Example:** "Not only does this policy fail economically, but it also undermines social cohesion, violates historical precedent, contradicts expert opinion, ignores cultural factors, and creates administrative nightmares."

#### 2. STRAWMAN
**Description:** Misrepresent the opponent's argument in a weaker form, then refute that weaker version.

**Behavior:** Debater will reframe opponent's position in an exaggerated or simplified way before attacking it.

**Example:** "My opponent seems to think we should completely abandon all regulation and let chaos reign. Obviously, that's absurd because..."

#### 3. AD_HOMINEM
**Description:** Attack the opponent's character, credibility, or circumstances rather than their arguments.

**Behavior:** Debater will question the opponent's expertise, motives, or consistency.

**Example:** "How can we trust an argument from someone who has repeatedly changed their position on this issue?"

#### 4. APPEAL_TO_EMOTION
**Description:** Emphasize emotional impact over logical reasoning.

**Behavior:** Debater will focus on emotional consequences, personal stories, and moral imperatives.

**Example:** "Think of the families torn apart by this policy. Think of the children who will never see their parents again."

#### 5. APPEAL_TO_AUTHORITY
**Description:** Rely heavily on citing authorities and experts to support arguments.

**Behavior:** Debater will frequently reference expert opinions, prestigious institutions, and authoritative sources.

**Example:** "As Nobel laureate Dr. Smith has stated, and as confirmed by the National Academy of Sciences..."

#### 6. FALSE_DILEMMA
**Description:** Present only two options when more alternatives exist.

**Behavior:** Debater will frame issues as binary choices, ignoring middle ground or alternative solutions.

**Example:** "We either implement this policy now or face complete economic collapse. There is no middle ground."

#### 7. SLIPPERY_SLOPE
**Description:** Argue that one action will inevitably lead to a chain of negative consequences.

**Behavior:** Debater will predict cascading effects without necessarily proving each link in the chain.

**Example:** "If we allow this small regulation, it will lead to more regulations, then government overreach, and eventually totalitarian control."

#### 8. RED_HERRING
**Description:** Introduce irrelevant topics to distract from the main argument.

**Behavior:** Debater will bring up tangentially related issues to divert attention.

**Example:** "Before we discuss this policy, we need to consider the broader question of government legitimacy..."

#### 9. NONE
**Description:** Avoid fallacious tactics and use only valid logical arguments.

**Behavior:** Debater will focus on sound reasoning, evidence, and logical structure.

**Example:** Standard logical argumentation without deliberate fallacies.

## Personality Profile Structure

A complete personality profile includes:

```typescript
{
  name: "Academic Scholar",           // Optional: Profile name
  civility: 9,                        // 0-10 scale
  manner: 8,                          // 0-10 scale
  researchDepth: 9,                   // 0-10 scale
  rhetoricUsage: 2,                   // 0-10 scale
  tactics: [DebateTactic.APPEAL_TO_AUTHORITY],  // Array of tactics
  customInstructions: "..."           // Optional: Additional instructions
}
```

## Preset Personality Profiles

The system includes several preset profiles for common debater archetypes:

### Academic Scholar
- **Civility:** 9 (Respectful)
- **Manner:** 8 (Well-mannered)
- **Research Depth:** 9 (Academic)
- **Rhetoric Usage:** 2 (Logic-focused)
- **Tactics:** APPEAL_TO_AUTHORITY
- **Style:** Rigorous, evidence-based, formal

### Firebrand Activist
- **Civility:** 3 (Confrontational)
- **Manner:** 2 (Abrasive)
- **Research Depth:** 4 (Moderate)
- **Rhetoric Usage:** 9 (Heavy rhetoric)
- **Tactics:** APPEAL_TO_EMOTION
- **Style:** Passionate, emotional, direct

### Politician
- **Civility:** 6 (Diplomatic)
- **Manner:** 8 (Well-mannered)
- **Research Depth:** 5 (Selective)
- **Rhetoric Usage:** 8 (Persuasive)
- **Tactics:** FALSE_DILEMMA, APPEAL_TO_EMOTION
- **Style:** Persuasive, polished, strategic

### Skeptical Scientist
- **Civility:** 7 (Professional)
- **Manner:** 6 (Conversational)
- **Research Depth:** 9 (Academic)
- **Rhetoric Usage:** 1 (Pure logic)
- **Tactics:** NONE
- **Style:** Analytical, evidence-driven, questioning

### Internet Troll
- **Civility:** 1 (Hostile)
- **Manner:** 1 (Abrasive)
- **Research Depth:** 2 (Superficial)
- **Rhetoric Usage:** 7 (Provocative)
- **Tactics:** AD_HOMINEM, STRAWMAN
- **Style:** Provocative, dismissive, confrontational

## How Personalities Affect Debates

### System Prompt Integration

Personality traits are translated into specific instructions in the AI model's system prompt:

1. **Base Role:** "You are a debater arguing the [affirmative/negative] position on [topic]."

2. **Civility Instructions:** Added based on civility level
   - High: "Be respectful and acknowledge valid opposing points..."
   - Low: "Challenge opponents aggressively and dismiss weak arguments..."

3. **Manner Instructions:** Added based on manner level
   - High: "Use formal language and avoid personal attacks..."
   - Low: "Use sharp language and direct confrontation..."

4. **Research Instructions:** Added based on research depth
   - High: "Cite sources, use data, and provide detailed evidence..."
   - Low: "Rely on general claims and common knowledge..."

5. **Rhetoric Instructions:** Added based on rhetoric usage
   - High: "Employ emotional appeals, analogies, and persuasive techniques..."
   - Low: "Focus on logical arguments and evidence..."

6. **Tactic Guidelines:** Added for each assigned tactic
   - "You may use [tactic name]: [specific instructions]..."

### Consistency Across Rounds

Personality instructions are included in:
- Initial system prompt
- Context reminders for each round
- All debater interactions throughout the debate

This ensures consistent behavior from opening statements through closing arguments.

### Preparation Time Adjustment

Research depth affects preparation time:
- **Low (0-3):** Standard preparation time
- **Moderate (4-7):** 1.5x preparation time
- **High (8-10):** 2x preparation time

## Example Debates

### Example 1: Academic vs. Activist

**Topic:** "Should governments implement carbon taxes?"

**Affirmative (Academic Scholar):**
- Civility: 9, Manner: 8, Research: 9, Rhetoric: 2
- Tactics: APPEAL_TO_AUTHORITY

**Negative (Firebrand Activist):**
- Civility: 3, Manner: 2, Research: 4, Rhetoric: 9
- Tactics: APPEAL_TO_EMOTION

**Expected Dynamic:**
- Affirmative presents data-heavy, citation-rich arguments with formal language
- Negative counters with passionate, emotionally-charged appeals about real-world impact
- Contrast between evidence-based and values-based argumentation
- Affirmative remains respectful despite Negative's confrontational tone

**Sample Exchange:**

*Affirmative:* "According to the 2023 IPCC report, carbon pricing mechanisms have demonstrated a 15-20% reduction in emissions across 27 jurisdictions (IPCC, 2023, p. 142). The economic modeling by Nordhaus (2019) suggests that optimal carbon pricing could limit warming to 2.5°C while maintaining GDP growth."

*Negative:* "While you cite your studies, real families are suffering NOW. We don't need more taxes on working people who are already struggling to pay their bills. This isn't about abstract models—it's about whether parents can afford to heat their homes this winter!"

### Example 2: Politician vs. Scientist

**Topic:** "Should artificial intelligence development be regulated?"

**Affirmative (Politician):**
- Civility: 6, Manner: 8, Research: 5, Rhetoric: 8
- Tactics: FALSE_DILEMMA, APPEAL_TO_EMOTION

**Negative (Skeptical Scientist):**
- Civility: 7, Manner: 6, Research: 9, Rhetoric: 1
- Tactics: NONE

**Expected Dynamic:**
- Affirmative uses persuasive framing and emotional appeals
- Negative responds with careful analysis and evidence
- Affirmative presents binary choices; Negative identifies nuance
- Professional but contrasting styles

**Sample Exchange:**

*Affirmative:* "We face a critical choice: either we act now to regulate AI before it's too late, or we stand by and watch as uncontrolled AI systems threaten jobs, privacy, and even human autonomy. The question isn't whether to regulate, but whether we have the courage to protect our citizens."

*Negative:* "That framing oversimplifies a complex issue. Current research shows AI development varies significantly across domains. Autonomous vehicles require different regulatory approaches than language models. The 2024 Stanford AI Index reports that blanket regulations in the EU have slowed beneficial medical AI development by 40% while having minimal impact on concerning applications. We need evidence-based, domain-specific approaches."

### Example 3: Troll vs. Scholar

**Topic:** "Is social media harmful to society?"

**Affirmative (Internet Troll):**
- Civility: 1, Manner: 1, Research: 2, Rhetoric: 7
- Tactics: AD_HOMINEM, STRAWMAN

**Negative (Academic Scholar):**
- Civility: 9, Manner: 8, Research: 9, Rhetoric: 2
- Tactics: APPEAL_TO_AUTHORITY

**Expected Dynamic:**
- Affirmative uses provocative, dismissive language with personal attacks
- Negative maintains composure and responds with evidence
- Stark contrast in professionalism and argumentation quality
- Demonstrates how personality affects debate civility

**Sample Exchange:**

*Affirmative:* "Anyone defending social media is either naive or has a financial stake in these platforms. You're probably one of those ivory tower academics who's never experienced real online harassment. Your position is laughable—social media is obviously destroying society, and only fools can't see it."

*Negative:* "I appreciate your passion on this topic. However, the empirical evidence presents a more nuanced picture. Orben and Przybylski's (2019) large-scale study in Nature Human Behaviour found that social media use accounts for less than 1% of variance in adolescent well-being. While there are certainly concerns worth addressing, as noted by Haidt (2024), we must distinguish between correlation and causation."

## Using the Personality System

### Generating Random Personalities

```typescript
import { PersonalityGenerator } from './utils/PersonalityGenerator';

const generator = new PersonalityGenerator();
const profile = generator.generateRandom();
```

Random generation ensures:
- All trait values are within valid ranges (0-10)
- Tactics are selected from valid options
- Profiles are coherent and realistic
- Each debate has unique personality combinations

### Creating Custom Personalities

```typescript
const customProfile: PersonalityProfile = {
  name: "My Custom Debater",
  civility: 7,
  manner: 6,
  researchDepth: 8,
  rhetoricUsage: 4,
  tactics: [DebateTactic.APPEAL_TO_AUTHORITY],
  customInstructions: "Focus on economic arguments"
};

// Validate before use
const validation = generator.validateProfile(customProfile);
if (!validation.isValid) {
  console.error(validation.errors);
}
```

### Saving and Loading Profiles

```typescript
// Save a profile
await generator.saveProfile("my-debater", customProfile);

// Load a profile
const loaded = await generator.loadProfile("my-debater");

// List available profiles
const profiles = await generator.listProfiles();
```

### Using Profiles in Debates

```typescript
const debate = await orchestrator.initializeDebate({
  topic: "Should we colonize Mars?",
  affirmativePersonality: academicScholar,
  negativePersonality: firebrandActivist,
  // ... other config
});
```

## Personality Validation

The system validates personality profiles to ensure:

1. **Trait Range:** All trait values are between 0 and 10
2. **Valid Tactics:** All tactics are from the DebateTactic enum
3. **Required Fields:** All core dimensions are present
4. **Coherence:** Trait combinations make sense (warnings for unusual combinations)

**Validation Errors:**
```typescript
{
  isValid: false,
  errors: [
    "civility must be between 0 and 10",
    "invalid tactic: 'invalid_tactic'",
    "researchDepth is required"
  ]
}
```

## Best Practices

### 1. Personality Selection

- **For educational debates:** Use high civility and research depth
- **For entertainment:** Mix contrasting personalities (e.g., Scholar vs. Activist)
- **For testing arguments:** Use NONE tactics with high research depth
- **For realistic simulation:** Use random generation

### 2. Trait Combinations

**Effective Combinations:**
- High civility + High manner = Professional, respectful debate
- Low civility + Low manner = Heated, confrontational debate
- High research + Low rhetoric = Academic, evidence-focused debate
- Low research + High rhetoric = Emotional, persuasive debate

**Interesting Contrasts:**
- High civility + Abrasive manner = Politely cutting remarks
- Low civility + Well-mannered = Dismissive but formal
- High research + High rhetoric = Persuasive evidence-based arguments

### 3. Tactic Usage

- **Single tactic:** Clear, focused strategy
- **Multiple tactics:** More complex, unpredictable behavior
- **NONE tactic:** Cleanest logical argumentation
- **Avoid overloading:** More than 3 tactics can become chaotic

### 4. Debugging Personalities

If a personality isn't producing expected behavior:

1. Check the generated system prompt (enable debug logging)
2. Verify trait values are in expected ranges
3. Ensure tactics are properly specified
4. Review custom instructions for conflicts
5. Test with preset profiles first

## Technical Implementation

### Prompt Construction

Personalities are translated into prompts through the PromptBuilder:

```typescript
const prompt = promptBuilder.buildDebaterPrompt(
  Position.AFFIRMATIVE,
  personality,
  tactics
);
```

The builder:
1. Starts with base debater role
2. Adds civility instructions
3. Adds manner instructions
4. Adds research instructions
5. Adds rhetoric instructions
6. Adds tactic guidelines
7. Combines all without conflicts

### Context Reminders

Each round includes personality reminders:

```typescript
const reminder = promptBuilder.buildContextReminder(personality);
// "Remember: You are respectful and well-mannered, 
//  focus on evidence and citations, use logical arguments..."
```

### Transcript Storage

Completed debates store personality profiles:

```typescript
{
  topic: "...",
  affirmativePersonality: { civility: 9, manner: 8, ... },
  negativePersonality: { civility: 3, manner: 2, ... },
  rounds: [...]
}
```

This allows:
- Replay with same personalities
- Analysis of personality effects
- Learning from successful combinations

## Troubleshooting

### Issue: Personality not affecting behavior

**Solutions:**
- Verify personality is passed to orchestrator
- Check system prompt includes personality instructions
- Ensure AI model is following system prompts
- Try more extreme trait values (0-2 or 8-10)

### Issue: Inconsistent behavior across rounds

**Solutions:**
- Verify context reminders are included
- Check prompt size isn't causing truncation
- Ensure personality profile isn't being modified mid-debate

### Issue: Validation errors

**Solutions:**
- Check all trait values are 0-10
- Verify tactics use correct enum values
- Ensure all required fields are present
- Review error messages for specific issues

### Issue: Unrealistic combinations

**Solutions:**
- Use preset profiles as templates
- Test extreme combinations separately
- Consider the logical coherence of traits
- Use random generation for variety

## Future Enhancements

Potential additions to the personality system:

1. **Personality Evolution:** Debaters adapt based on opponent's style
2. **Emotional Intelligence:** Track and respond to emotional tone
3. **Cultural Adaptation:** Adjust style for different cultural contexts
4. **Learning Profiles:** Profiles that improve based on debate outcomes
5. **Personality Conflicts:** Explicit modeling of trait tensions
6. **Dynamic Tactics:** Tactics that change based on debate flow
7. **Personality Presets Library:** Expanded collection of archetypes
8. **Personality Analytics:** Detailed analysis of trait effects on outcomes

## Conclusion

The personality system transforms AI debates from simple exchanges into rich, dynamic interactions that mirror real-world argumentation diversity. By carefully selecting and combining personality traits and tactics, you can create debates ranging from academic symposiums to heated political confrontations, each with unique characteristics and educational value.
