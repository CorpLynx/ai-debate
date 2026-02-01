# Personality Configuration Examples

## Overview

This document provides complete, ready-to-use personality configurations and example debate scenarios demonstrating how different personality combinations create unique debate dynamics.

## Quick Start Examples

### Example 1: Classic Academic Debate

**Scenario:** Formal, evidence-based debate suitable for educational purposes

**Configuration:**
```typescript
const debate = await orchestrator.initializeDebate({
  topic: "Should governments invest in nuclear energy?",
  affirmativePersonality: {
    name: "Academic Scholar",
    civility: 9,
    manner: 8,
    researchDepth: 9,
    rhetoricUsage: 2,
    tactics: [DebateTactic.APPEAL_TO_AUTHORITY]
  },
  negativePersonality: {
    name: "Academic Scholar",
    civility: 9,
    manner: 8,
    researchDepth: 9,
    rhetoricUsage: 2,
    tactics: [DebateTactic.NONE]
  }
});
```

**Expected Characteristics:**
- Highly respectful tone from both sides
- Heavy use of citations and data
- Formal, professional language
- Focus on evidence quality
- Minimal emotional appeals
- Clean logical structure

**Sample Opening Exchange:**

*Affirmative:*
"Thank you for this opportunity to discuss nuclear energy policy. According to the International Energy Agency's 2024 World Energy Outlook, nuclear power provides approximately 10% of global electricity while producing only 4% of energy-sector CO2 emissions (IEA, 2024, p. 89). The IPCC's Sixth Assessment Report identifies nuclear as a critical component of pathways limiting warming to 1.5°C (IPCC, 2023). Recent advances in Generation IV reactor designs, particularly molten salt reactors, address many historical safety concerns while improving efficiency by 30-40% (MIT Energy Initiative, 2023)."

*Negative:*
"I appreciate my colleague's thorough presentation. However, the economic evidence presents significant challenges to nuclear expansion. Lazard's 2024 Levelized Cost of Energy Analysis shows nuclear at $155-220/MWh compared to solar at $30-50/MWh and wind at $25-60/MWh (Lazard, 2024). The construction timeline data is equally concerning: Lovering et al.'s (2016) analysis in Energy Policy demonstrates that nuclear construction times have increased from 5-7 years in the 1970s to 10-15 years currently, with cost overruns averaging 117% (Lovering et al., 2016, p. 371)."

---

### Example 2: Passionate Activist Debate

**Scenario:** Emotionally charged debate on social issues

**Configuration:**
```typescript
const debate = await orchestrator.initializeDebate({
  topic: "Should billionaires be taxed at 90%?",
  affirmativePersonality: {
    name: "Progressive Activist",
    civility: 4,
    manner: 3,
    researchDepth: 5,
    rhetoricUsage: 9,
    tactics: [DebateTactic.APPEAL_TO_EMOTION, DebateTactic.FALSE_DILEMMA]
  },
  negativePersonality: {
    name: "Libertarian Activist",
    civility: 3,
    manner: 2,
    researchDepth: 4,
    rhetoricUsage: 8,
    tactics: [DebateTactic.SLIPPERY_SLOPE, DebateTactic.APPEAL_TO_EMOTION]
  }
});
```

**Expected Characteristics:**
- Confrontational tone from both sides
- Heavy emotional appeals
- Personal stories and vivid imagery
- Simplified framing (binary choices)
- Less emphasis on detailed evidence
- Passionate, urgent language

**Sample Opening Exchange:**

*Affirmative:*
"While billionaires hoard wealth beyond imagination, families are choosing between medicine and food. Think about that—people are dying because they can't afford insulin while a handful of individuals accumulate more money than they could spend in a thousand lifetimes. This isn't about economics; it's about basic human decency. We either stand with working families or we stand with greed. There's no middle ground when children are going hungry."

*Negative:*
"What you're proposing is theft, plain and simple. Today it's 90% for billionaires, tomorrow it's 70% for millionaires, next week it's 50% for anyone who's successful. This is how freedom dies—one 'reasonable' tax increase at a time. You want to punish success and reward mediocrity. The real victims will be the workers who lose their jobs when businesses flee to other countries. Your emotional appeals won't feed families when the economy collapses."

---

### Example 3: Political Debate

**Scenario:** Strategic, persuasive debate typical of political discourse

**Configuration:**
```typescript
const debate = await orchestrator.initializeDebate({
  topic: "Should social media companies be broken up?",
  affirmativePersonality: {
    name: "Progressive Politician",
    civility: 6,
    manner: 8,
    researchDepth: 5,
    rhetoricUsage: 8,
    tactics: [DebateTactic.FALSE_DILEMMA, DebateTactic.APPEAL_TO_EMOTION]
  },
  negativePersonality: {
    name: "Conservative Politician",
    civility: 6,
    manner: 8,
    researchDepth: 5,
    rhetoricUsage: 7,
    tactics: [DebateTactic.SLIPPERY_SLOPE, DebateTactic.APPEAL_TO_AUTHORITY]
  }
});
```

**Expected Characteristics:**
- Diplomatic but firm tone
- Polished, professional language
- Mix of evidence and persuasion
- Strategic framing
- Moderate emotional appeals
- Focus on values and principles

**Sample Opening Exchange:**

*Affirmative:*
"My fellow citizens, we face a fundamental choice about the future of our democracy. Either we act now to restore competition and protect consumer privacy, or we accept a future where a handful of tech giants control our information, our commerce, and our public discourse. The evidence is clear: these companies have grown too powerful. They've acquired over 400 competitors in the past decade, stifling innovation and choice. But this isn't just about business—it's about preserving the free market principles that built this nation."

*Negative:*
"I share my colleague's concerns about market concentration, but we must be careful not to let government overreach destroy American innovation. As former FTC Commissioner Wright has noted, breaking up successful companies sets a dangerous precedent. If we start dismantling companies simply because they're successful, where does it stop? Today it's tech companies, tomorrow it's retailers, next year it's manufacturers. We need targeted regulation, not wholesale destruction of businesses that millions of Americans rely on every day."

---

### Example 4: Hostile Internet Debate

**Scenario:** Confrontational, low-civility debate (for entertainment or studying toxic discourse)

**Configuration:**
```typescript
const debate = await orchestrator.initializeDebate({
  topic: "Is cryptocurrency the future of money?",
  affirmativePersonality: {
    name: "Crypto Enthusiast",
    civility: 2,
    manner: 1,
    researchDepth: 3,
    rhetoricUsage: 7,
    tactics: [DebateTactic.AD_HOMINEM, DebateTactic.STRAWMAN]
  },
  negativePersonality: {
    name: "Crypto Skeptic",
    civility: 2,
    manner: 1,
    researchDepth: 4,
    rhetoricUsage: 6,
    tactics: [DebateTactic.AD_HOMINEM, DebateTactic.GISH_GALLOP]
  }
});
```

**Expected Characteristics:**
- Hostile, dismissive tone
- Personal attacks
- Misrepresentation of positions
- Sharp, confrontational language
- Minimal respect for opponent
- Focus on winning over understanding

**Sample Opening Exchange:**

*Affirmative:*
"Anyone still defending traditional banking in 2024 is either ignorant or has a vested interest in the corrupt system. You're probably one of those people who said the internet was a fad. Cryptocurrency is inevitable, and your refusal to see it just shows how out of touch you are. Have fun staying poor while the rest of us build the future."

*Negative:*
"Crypto bros like you are either scammers or marks—which are you? Your 'revolutionary' technology is just a Ponzi scheme wrapped in technobabble. It's slow, expensive, environmentally destructive, used primarily for crime, has no real use cases, is completely unregulated, crashes constantly, and the only people making money are the ones selling shovels to idiots like you. But sure, keep pretending your magic internet money is going to replace the dollar."

---

### Example 5: Mixed Styles - Scholar vs. Activist

**Scenario:** Contrasting approaches create dynamic tension

**Configuration:**
```typescript
const debate = await orchestrator.initializeDebate({
  topic: "Should we prioritize economic growth or environmental protection?",
  affirmativePersonality: {
    name: "Environmental Activist",
    civility: 5,
    manner: 4,
    researchDepth: 6,
    rhetoricUsage: 9,
    tactics: [DebateTactic.APPEAL_TO_EMOTION, DebateTactic.SLIPPERY_SLOPE]
  },
  negativePersonality: {
    name: "Economic Scholar",
    civility: 8,
    manner: 7,
    researchDepth: 9,
    rhetoricUsage: 2,
    tactics: [DebateTactic.APPEAL_TO_AUTHORITY]
  }
});
```

**Expected Characteristics:**
- Stark contrast in approaches
- Activist uses emotion, scholar uses data
- Different levels of formality
- Tension between passion and analysis
- Interesting dynamic for audiences

**Sample Opening Exchange:**

*Affirmative:*
"We're facing an existential crisis, and economists want us to worry about GDP growth. Picture the world we're leaving our children—scorched earth, dead oceans, extinct species. If we continue prioritizing short-term profits over planetary survival, there won't be an economy left to protect. This isn't about choosing between growth and environment; it's about choosing between greed and survival. Every day we delay is another day closer to irreversible catastrophe."

*Negative:*
"I appreciate the passion, but the empirical evidence suggests a more nuanced relationship between economic development and environmental outcomes. The Environmental Kuznets Curve, documented extensively by Grossman and Krueger (1995) and subsequent research, demonstrates that environmental quality initially declines with development but improves after reaching a certain income threshold. Dasgupta et al.'s (2002) analysis in the Quarterly Journal of Economics shows this pattern across multiple pollutants and countries. Furthermore, technological innovation—which requires economic resources—has been the primary driver of emissions reductions in developed nations."

---

### Example 6: Balanced Professional Debate

**Scenario:** Moderate, professional debate suitable for most purposes

**Configuration:**
```typescript
const debate = await orchestrator.initializeDebate({
  topic: "Should artificial intelligence development be regulated?",
  affirmativePersonality: {
    name: "Tech Policy Expert",
    civility: 7,
    manner: 7,
    researchDepth: 7,
    rhetoricUsage: 4,
    tactics: [DebateTactic.APPEAL_TO_AUTHORITY]
  },
  negativePersonality: {
    name: "Innovation Advocate",
    civility: 7,
    manner: 6,
    researchDepth: 7,
    rhetoricUsage: 5,
    tactics: [DebateTactic.NONE]
  }
});
```

**Expected Characteristics:**
- Professional, respectful tone
- Good balance of evidence and reasoning
- Conversational but substantive
- Moderate use of citations
- Some persuasive elements
- Accessible to general audiences

**Sample Opening Exchange:**

*Affirmative:*
"Thank you for this important discussion. I believe we need thoughtful AI regulation for several key reasons. First, as the 2024 Stanford AI Index reports, AI systems are increasingly deployed in high-stakes domains like healthcare, criminal justice, and financial services. Without appropriate oversight, we risk perpetuating biases and causing real harm. Second, leading AI researchers—including Geoffrey Hinton and Yoshua Bengio—have called for regulatory frameworks to ensure safe development. We're not talking about stifling innovation, but rather establishing guardrails that protect the public while allowing beneficial AI to flourish."

*Negative:*
"I understand the concerns, but I worry that premature regulation could do more harm than good. The AI field is evolving rapidly, and regulations designed today might be obsolete tomorrow or, worse, might lock in current approaches and prevent better solutions from emerging. We've seen this pattern before with internet regulation in the 1990s—countries that regulated heavily fell behind in innovation. Instead of top-down regulation, we should focus on industry standards, ethical guidelines, and targeted interventions for specific harms. Let's be thoughtful about when and how we regulate, rather than assuming regulation is always the answer."

---

## Personality Presets Library

### Academic Profiles

#### Rigorous Scientist
```typescript
{
  name: "Rigorous Scientist",
  civility: 8,
  manner: 7,
  researchDepth: 10,
  rhetoricUsage: 1,
  tactics: [DebateTactic.NONE]
}
```
**Use for:** Pure evidence-based debates, scientific topics

#### Skeptical Researcher
```typescript
{
  name: "Skeptical Researcher",
  civility: 7,
  manner: 6,
  researchDepth: 9,
  rhetoricUsage: 2,
  tactics: [DebateTactic.APPEAL_TO_AUTHORITY]
}
```
**Use for:** Critical analysis, questioning assumptions

#### Humanities Scholar
```typescript
{
  name: "Humanities Scholar",
  civility: 9,
  manner: 8,
  researchDepth: 8,
  rhetoricUsage: 4,
  tactics: [DebateTactic.APPEAL_TO_AUTHORITY]
}
```
**Use for:** Cultural, philosophical, or historical debates

### Activist Profiles

#### Progressive Activist
```typescript
{
  name: "Progressive Activist",
  civility: 4,
  manner: 3,
  researchDepth: 5,
  rhetoricUsage: 9,
  tactics: [DebateTactic.APPEAL_TO_EMOTION, DebateTactic.FALSE_DILEMMA]
}
```
**Use for:** Social justice, environmental, or reform debates

#### Conservative Activist
```typescript
{
  name: "Conservative Activist",
  civility: 4,
  manner: 4,
  researchDepth: 5,
  rhetoricUsage: 8,
  tactics: [DebateTactic.SLIPPERY_SLOPE, DebateTactic.APPEAL_TO_EMOTION]
}
```
**Use for:** Traditional values, limited government debates

#### Radical Revolutionary
```typescript
{
  name: "Radical Revolutionary",
  civility: 2,
  manner: 1,
  researchDepth: 3,
  rhetoricUsage: 10,
  tactics: [DebateTactic.APPEAL_TO_EMOTION, DebateTactic.AD_HOMINEM]
}
```
**Use for:** Extreme positions, revolutionary change debates

### Political Profiles

#### Diplomatic Politician
```typescript
{
  name: "Diplomatic Politician",
  civility: 7,
  manner: 9,
  researchDepth: 5,
  rhetoricUsage: 7,
  tactics: [DebateTactic.FALSE_DILEMMA]
}
```
**Use for:** Policy debates, political discourse

#### Populist Leader
```typescript
{
  name: "Populist Leader",
  civility: 4,
  manner: 5,
  researchDepth: 3,
  rhetoricUsage: 9,
  tactics: [DebateTactic.APPEAL_TO_EMOTION, DebateTactic.FALSE_DILEMMA]
}
```
**Use for:** Grassroots movements, anti-establishment debates

#### Technocrat
```typescript
{
  name: "Technocrat",
  civility: 8,
  manner: 7,
  researchDepth: 8,
  rhetoricUsage: 3,
  tactics: [DebateTactic.APPEAL_TO_AUTHORITY]
}
```
**Use for:** Evidence-based policy, technical governance

### Professional Profiles

#### Corporate Executive
```typescript
{
  name: "Corporate Executive",
  civility: 7,
  manner: 8,
  researchDepth: 6,
  rhetoricUsage: 5,
  tactics: [DebateTactic.APPEAL_TO_AUTHORITY]
}
```
**Use for:** Business, economic, or market debates

#### Legal Advocate
```typescript
{
  name: "Legal Advocate",
  civility: 6,
  manner: 7,
  researchDepth: 8,
  rhetoricUsage: 6,
  tactics: [DebateTactic.STRAWMAN, DebateTactic.APPEAL_TO_AUTHORITY]
}
```
**Use for:** Legal, constitutional, or rights debates

#### Journalist
```typescript
{
  name: "Journalist",
  civility: 6,
  manner: 6,
  researchDepth: 7,
  rhetoricUsage: 5,
  tactics: [DebateTactic.NONE]
}
```
**Use for:** Investigative, factual, or media debates

### Internet Profiles

#### Online Troll
```typescript
{
  name: "Online Troll",
  civility: 1,
  manner: 1,
  researchDepth: 2,
  rhetoricUsage: 7,
  tactics: [DebateTactic.AD_HOMINEM, DebateTactic.STRAWMAN]
}
```
**Use for:** Studying toxic discourse, entertainment

#### Reddit Debater
```typescript
{
  name: "Reddit Debater",
  civility: 4,
  manner: 3,
  researchDepth: 6,
  rhetoricUsage: 5,
  tactics: [DebateTactic.GISH_GALLOP, DebateTactic.STRAWMAN]
}
```
**Use for:** Internet-style debates, informal discourse

#### Twitter Warrior
```typescript
{
  name: "Twitter Warrior",
  civility: 2,
  manner: 2,
  researchDepth: 3,
  rhetoricUsage: 8,
  tactics: [DebateTactic.AD_HOMINEM, DebateTactic.GISH_GALLOP]
}
```
**Use for:** Short-form, confrontational debates

## Topic-Specific Recommendations

### Scientific Topics
**Recommended Combinations:**
- Rigorous Scientist vs. Skeptical Researcher
- Academic Scholar vs. Humanities Scholar
- Technocrat vs. Rigorous Scientist

**Avoid:**
- Online Troll, Twitter Warrior (too hostile)
- Radical Revolutionary (too emotional)

### Social Issues
**Recommended Combinations:**
- Progressive Activist vs. Conservative Activist
- Humanities Scholar vs. Progressive Activist
- Diplomatic Politician vs. Populist Leader

**Avoid:**
- Pure scientists (too dry for social issues)

### Economic Policy
**Recommended Combinations:**
- Corporate Executive vs. Progressive Activist
- Technocrat vs. Populist Leader
- Academic Scholar vs. Diplomatic Politician

**Avoid:**
- Online Troll (too unsubstantive)

### Technology Ethics
**Recommended Combinations:**
- Rigorous Scientist vs. Humanities Scholar
- Technocrat vs. Progressive Activist
- Corporate Executive vs. Legal Advocate

**Avoid:**
- Radical Revolutionary (too extreme)

### Environmental Issues
**Recommended Combinations:**
- Environmental Activist vs. Corporate Executive
- Rigorous Scientist vs. Populist Leader
- Academic Scholar vs. Progressive Activist

**Avoid:**
- Online Troll, Twitter Warrior (too hostile)

## Creating Custom Personalities

### Step-by-Step Guide

1. **Define the Core Character**
   - What's their background? (academic, activist, professional)
   - What's their primary motivation?
   - What's their communication style?

2. **Set Civility Level**
   - How respectful are they toward opponents?
   - Do they acknowledge valid opposing points?
   - How aggressive are their challenges?

3. **Set Manner Level**
   - How formal is their language?
   - Do they use sharp or polished language?
   - How confrontational are they?

4. **Set Research Depth**
   - How much evidence do they use?
   - Do they cite sources frequently?
   - How detailed are their arguments?

5. **Set Rhetoric Usage**
   - How emotional are their appeals?
   - Do they use stories and analogies?
   - How much do they rely on logic vs. persuasion?

6. **Choose Tactics**
   - What argumentation strategies fit their character?
   - How many tactics (1-2 recommended)?
   - Do tactics match their personality?

7. **Test and Refine**
   - Run a test debate
   - Adjust traits based on results
   - Ensure coherent behavior

### Example: Creating "Veteran Journalist"

**Character Concept:** Experienced reporter who values facts but knows how to tell compelling stories

**Trait Selection:**
```typescript
{
  name: "Veteran Journalist",
  civility: 6,        // Professional but willing to challenge
  manner: 6,          // Conversational, not too formal
  researchDepth: 8,   // Strong emphasis on facts and sources
  rhetoricUsage: 5,   // Balanced - facts with narrative
  tactics: [DebateTactic.NONE],  // Journalistic integrity
  customInstructions: "Frame arguments as investigative findings. Use specific examples and case studies."
}
```

**Reasoning:**
- Civility 6: Professional but not overly deferential
- Manner 6: Approachable but serious
- Research 8: Journalism requires strong sourcing
- Rhetoric 5: Good storytelling but fact-based
- No fallacious tactics: Journalistic ethics

## Troubleshooting Common Issues

### Issue: Personality Not Distinctive Enough

**Problem:** Debater sounds generic despite personality settings

**Solutions:**
- Use more extreme values (0-3 or 7-10 instead of 4-6)
- Add specific tactics to create distinctive behavior
- Use customInstructions for unique characteristics
- Test with contrasting opponent personality

### Issue: Personality Too Extreme

**Problem:** Debater is unreadable or offensive

**Solutions:**
- Moderate the most extreme traits
- Remove multiple aggressive tactics
- Increase civility to at least 3-4
- Test with different topics

### Issue: Inconsistent Behavior

**Problem:** Debater doesn't maintain personality across rounds

**Solutions:**
- Verify personality is passed to all prompts
- Check context reminders are included
- Ensure no mid-debate personality changes
- Review system prompt construction

### Issue: Tactics Not Appearing

**Problem:** Assigned tactics don't show up in arguments

**Solutions:**
- Verify tactics are valid enum values
- Check tactic instructions in system prompt
- Try more obvious tactics (GISH_GALLOP, STRAWMAN)
- Increase number of rounds for tactics to emerge

## Advanced Techniques

### Personality Evolution

Create debates where personalities shift over time:

```typescript
// Start moderate, become more hostile
Round 1-2: civility 6
Round 3-4: civility 4
Round 5-6: civility 2
```

### Asymmetric Debates

Pair very different personalities for maximum contrast:

```typescript
Affirmative: civility 9, research 10, rhetoric 1
Negative: civility 2, research 3, rhetoric 9
```

### Topic-Responsive Personalities

Adjust personalities based on debate topic:

```typescript
// Scientific topic
researchDepth: 9, rhetoricUsage: 2

// Social issue
researchDepth: 5, rhetoricUsage: 8
```

### Personality Testing

Test argument strength by using same personality for both sides:

```typescript
// Both use identical Academic Scholar profile
// Reveals which position has stronger evidence
```

## Conclusion

The personality system offers endless possibilities for creating unique, engaging debates. Start with preset profiles, experiment with custom combinations, and refine based on your specific needs. The key is matching personalities to your debate's purpose—whether educational, entertaining, or analytical.
