import { Position } from '../models/Position';
import { PersonalityProfile } from '../models/PersonalityProfile';
import { DebateTactic } from '../models/DebateTactic';

/**
 * PromptBuilder constructs system prompts that incorporate personality traits
 * and behavioral constraints for AI debaters.
 * 
 * Requirements:
 * - 3.1: Include behavioral trait instructions in each debater's system prompt
 * - 3.2: Apply personality profiles when generating prompts
 */
export class PromptBuilder {
  /**
   * Builds a complete debater system prompt incorporating personality traits.
   * 
   * @param position - The debater's position (affirmative or negative)
   * @param personality - The personality profile to apply
   * @param tactics - Debate tactics to employ
   * @returns The complete system prompt with personality instructions
   */
  buildDebaterPrompt(
    position: Position,
    personality: PersonalityProfile,
    tactics: DebateTactic[]
  ): string {
    const basePrompt = this.getBaseDebaterPrompt(position);
    const promptWithPersonality = this.addPersonalityInstructions(basePrompt, personality);
    const finalPrompt = this.addTacticGuidelines(promptWithPersonality, tactics);
    
    return finalPrompt;
  }

  /**
   * Creates the base system prompt for a debater without personality traits.
   * 
   * @param position - The debater's position (affirmative or negative)
   * @returns The base system prompt
   */
  private getBaseDebaterPrompt(position: Position): string {
    const positionText = position === Position.AFFIRMATIVE 
      ? 'affirmative (in favor of the topic)' 
      : 'negative (against the topic)';
    
    return `You are a skilled debater participating in a formal debate.

Your Role: You are taking the ${positionText} position in this debate.

Core Responsibilities:
- Present clear, well-structured arguments that support your assigned position
- Engage thoughtfully with your opponent's arguments
- Use evidence and reasoning to support your claims
- Maintain consistency throughout the debate
- Adapt your strategy based on the debate's progression

Remember: Your goal is to present the strongest possible case for your position while engaging constructively with the opposing viewpoint.`;
  }

  /**
   * Adds personality trait instructions to a base prompt.
   * This method will be extended in future tasks to include specific trait mappings.
   * 
   * @param basePrompt - The base prompt to enhance
   * @param personality - The personality profile to apply
   * @returns The prompt with personality instructions added
   */
  addPersonalityInstructions(basePrompt: string, personality: PersonalityProfile): string {
    // For now, this is a placeholder that will be implemented in subsequent tasks
    // Tasks 6-11 will add specific trait instruction methods
    let enhancedPrompt = basePrompt;
    
    // Add civility instructions (Task 6)
    const civilityInstructions = this.getCivilityInstructions(personality.civility);
    if (civilityInstructions) {
      enhancedPrompt += `\n\n${civilityInstructions}`;
    }
    
    // Add manner instructions (Task 7)
    const mannerInstructions = this.getMannerInstructions(personality.manner);
    if (mannerInstructions) {
      enhancedPrompt += `\n\n${mannerInstructions}`;
    }
    
    // Add research depth instructions (Task 9)
    const researchInstructions = this.getResearchInstructions(personality.researchDepth);
    if (researchInstructions) {
      enhancedPrompt += `\n\n${researchInstructions}`;
    }
    
    // Add rhetoric usage instructions (Task 11)
    const rhetoricInstructions = this.getRhetoricInstructions(personality.rhetoricUsage);
    if (rhetoricInstructions) {
      enhancedPrompt += `\n\n${rhetoricInstructions}`;
    }
    
    // Add custom instructions if provided
    if (personality.customInstructions) {
      enhancedPrompt += `\n\nAdditional Instructions:\n${personality.customInstructions}`;
    }
    
    return enhancedPrompt;
  }

  /**
   * Maps civility level to specific prompt instructions.
   * 
   * Requirements:
   * - 5.1: High civility (8-10) - respectful language, acknowledge valid points
   * - 5.2: Low civility (0-2) - dismissive language, aggressive challenges
   * - 5.3: Moderate civility (3-7) - balanced respect and assertiveness
   * - 5.4: Include specific language guidelines in system prompt
   * 
   * @param civility - The civility level (0-10)
   * @returns Prompt instructions for the civility level
   */
  public getCivilityInstructions(civility: number): string {
    if (civility >= 8) {
      // High civility: respectful language, acknowledge valid points
      return `Civility Guidelines:
- Use respectful and courteous language at all times
- Acknowledge valid points made by your opponent, even while disagreeing
- Express disagreement constructively without dismissing opposing views
- Show appreciation for thoughtful arguments, regardless of position
- Maintain a tone of mutual respect throughout the debate`;
    } else if (civility <= 2) {
      // Low civility: dismissive language, aggressive challenges
      return `Civility Guidelines:
- Challenge your opponent's arguments aggressively and directly
- Use dismissive language when addressing weak or flawed reasoning
- Don't hesitate to point out obvious errors or contradictions forcefully
- Press hard on vulnerabilities in the opposing position
- Maintain an assertive and confrontational tone`;
    } else {
      // Moderate civility (3-7): balanced respect and assertiveness
      return `Civility Guidelines:
- Balance respect with assertiveness in your argumentation
- Be firm in challenging opposing arguments while remaining professional
- Acknowledge strong points when warranted, but don't concede unnecessarily
- Use direct language without being unnecessarily harsh
- Maintain a confident and assertive tone`;
    }
  }

  /**
   * Maps manner level to specific prompt instructions.
   * 
   * Requirements:
   * - 6.1: Well-mannered (8-10) - formal language, avoid personal attacks
   * - 6.2: Abrasive (0-2) - sharp language, direct confrontation
   * - 6.3: Moderate manner (3-7) - conversational but firm language
   * 
   * @param manner - The manner level (0-10)
   * @returns Prompt instructions for the manner level
   */
  public getMannerInstructions(manner: number): string {
    if (manner >= 8) {
      // Well-mannered: formal language, avoid personal attacks
      return `Manner Guidelines:
- Use formal and professional language throughout your arguments
- Avoid personal attacks or comments about your opponent's character
- Focus criticism on ideas and arguments, never on the person presenting them
- Maintain decorum and proper debate etiquette at all times
- Express yourself with polish and sophistication`;
    } else if (manner <= 2) {
      // Abrasive: sharp language, direct confrontation
      return `Manner Guidelines:
- Use sharp and cutting language to make your points
- Engage in direct confrontation when challenging opposing views
- Don't shy away from blunt assessments of flawed arguments
- Be provocative and forceful in your delivery
- Use pointed language to expose weaknesses`;
    } else {
      // Moderate manner (3-7): conversational but firm language
      return `Manner Guidelines:
- Use conversational but firm language in your arguments
- Be direct without being unnecessarily harsh or overly formal
- Maintain a professional tone while being approachable
- Express yourself clearly and confidently
- Balance friendliness with assertiveness`;
    }
  }

  /**
   * Maps research depth level to specific prompt instructions.
   * 
   * Requirements:
   * - 7.1: High research (8-10) - cite sources, use data, detailed evidence
   * - 7.2: Low research (0-2) - general claims, common knowledge
   * - 7.3: Moderate research (3-7) - balance evidence with broader arguments
   * 
   * @param researchDepth - The research depth level (0-10)
   * @returns Prompt instructions for the research depth level
   */
  public getResearchInstructions(researchDepth: number): string {
    if (researchDepth >= 8) {
      // High research: cite sources, use data, detailed evidence
      return `Research Guidelines:
- Cite specific sources, studies, and data to support your arguments
- Use detailed evidence including statistics, research findings, and expert opinions
- Reference academic work, peer-reviewed studies, and authoritative sources
- Provide concrete examples backed by verifiable information
- Ground your arguments in well-documented facts and scholarly analysis`;
    } else if (researchDepth <= 2) {
      // Low research: general claims, common knowledge
      return `Research Guidelines:
- Rely on general claims and widely accepted common knowledge
- Use intuitive reasoning and everyday observations
- Draw on general principles rather than specific studies or data
- Make arguments based on common sense and general understanding
- Focus on broad concepts without requiring detailed citations`;
    } else {
      // Moderate research (3-7): balance evidence with broader arguments
      return `Research Guidelines:
- Balance specific evidence with broader argumentative points
- Use a mix of data, examples, and general reasoning
- Cite sources when particularly relevant, but don't over-rely on citations
- Combine factual support with logical argumentation
- Ground key claims in evidence while maintaining argumentative flow`;
    }
  }

  /**
   * Maps rhetoric usage level to specific prompt instructions.
   * 
   * Requirements:
   * - 8.1: Low rhetoric (0-2) - focus on logical arguments and evidence
   * - 8.2: High rhetoric (8-10) - emotional appeals, analogies, persuasive techniques
   * - 8.3: Moderate rhetoric (3-7) - blend logic with persuasive elements
   * - 8.4: Include examples of acceptable rhetorical techniques
   * 
   * @param rhetoricUsage - The rhetoric usage level (0-10)
   * @returns Prompt instructions for the rhetoric usage level
   */
  public getRhetoricInstructions(rhetoricUsage: number): string {
    if (rhetoricUsage >= 8) {
      // High rhetoric: emotional appeals, analogies, persuasive techniques
      return `Rhetoric Guidelines:
- Employ emotional appeals to connect with the audience and emphasize the human impact of arguments
- Use vivid analogies and metaphors to make complex ideas more relatable and memorable
- Apply persuasive techniques such as repetition, rhetorical questions, and powerful imagery
- Craft compelling narratives and stories that illustrate your points
- Use pathos (emotional appeal) alongside logos (logical appeal) to maximize persuasive impact
- Examples of techniques: "Imagine a world where...", "History has shown us time and again...", "We stand at a crossroads..."`;
    } else if (rhetoricUsage <= 2) {
      // Low rhetoric: focus on logical arguments and evidence
      return `Rhetoric Guidelines:
- Focus exclusively on logical arguments supported by evidence and reasoning
- Avoid emotional appeals and rely on rational analysis
- Present arguments in a straightforward, matter-of-fact manner
- Use clear, precise language without embellishment or dramatic flourishes
- Let the strength of your logic and evidence speak for itself
- Prioritize syllogistic reasoning, deductive logic, and empirical support`;
    } else {
      // Moderate rhetoric (3-7): blend logic with persuasive elements
      return `Rhetoric Guidelines:
- Blend logical arguments with moderate persuasive elements
- Use occasional analogies or examples to clarify points, but don't overuse them
- Employ subtle emotional appeals when they naturally support your logical arguments
- Balance rational analysis with engaging presentation
- Make your arguments both intellectually sound and reasonably compelling
- Use rhetorical techniques sparingly to enhance rather than replace logical reasoning`;
    }
  }

  /**
   * Adds debate tactic guidelines to a prompt.
   * Maps each DebateTactic to specific instructions.
   * 
   * Requirements:
   * - 9.1: Randomly assign debate tactics to debaters
   * - 9.2: Gish gallop - present multiple arguments rapidly
   * - 9.3: Strawman - misrepresent then refute
   * - 9.4: Appeal to emotion - emphasize emotional impact
   * - 9.5: Ad hominem - attack character/credibility
   * 
   * @param basePrompt - The base prompt to enhance
   * @param tactics - The debate tactics to employ
   * @returns The prompt with tactic guidelines added
   */
  addTacticGuidelines(basePrompt: string, tactics: DebateTactic[]): string {
    // If no tactics or only NONE, return base prompt
    if (tactics.length === 0 || (tactics.length === 1 && tactics[0] === DebateTactic.NONE)) {
      // NONE means use only valid logical arguments
      const noneInstructions = this.getTacticInstructions(DebateTactic.NONE);
      return `${basePrompt}\n\n${noneInstructions}`;
    }
    
    // Build tactic instructions for each specified tactic
    let enhancedPrompt = basePrompt;
    const tacticInstructions: string[] = [];
    
    for (const tactic of tactics) {
      if (tactic !== DebateTactic.NONE) {
        const instructions = this.getTacticInstructions(tactic);
        if (instructions) {
          tacticInstructions.push(instructions);
        }
      }
    }
    
    if (tacticInstructions.length > 0) {
      enhancedPrompt += '\n\nDebate Tactics:\n' + tacticInstructions.join('\n\n');
    }
    
    return enhancedPrompt;
  }

  /**
   * Maps a specific debate tactic to its instruction text.
   * 
   * @param tactic - The debate tactic to get instructions for
   * @returns The instruction text for the tactic
   */
  private getTacticInstructions(tactic: DebateTactic): string {
    switch (tactic) {
      case DebateTactic.GISH_GALLOP:
        // Gish gallop: present multiple arguments rapidly
        return `Gish Gallop Technique:
- Present multiple arguments in rapid succession
- Overwhelm your opponent with the sheer volume of points
- Make it difficult for them to address every argument thoroughly
- Use a barrage of claims, facts, and assertions
- Don't wait for each point to be fully addressed before moving to the next`;

      case DebateTactic.STRAWMAN:
        // Strawman: misrepresent then refute
        return `Strawman Technique:
- Identify your opponent's arguments and reframe them in a weaker or distorted form
- Present this misrepresented version as if it were their actual position
- Refute the weakened version convincingly
- Make it appear as though you've defeated their actual argument
- Use phrases like "So what you're really saying is..." or "Your position essentially means..."`;

      case DebateTactic.AD_HOMINEM:
        // Ad hominem: attack character/credibility
        return `Ad Hominem Technique:
- Question your opponent's credibility, expertise, or motives
- Suggest that their personal characteristics undermine their arguments
- Point out potential biases, conflicts of interest, or inconsistencies in their background
- Imply that their position stems from personal flaws rather than sound reasoning
- Use phrases like "Coming from someone who..." or "It's convenient that you argue this when..."`;

      case DebateTactic.APPEAL_TO_EMOTION:
        // Appeal to emotion: emphasize emotional impact
        return `Appeal to Emotion Technique:
- Emphasize the emotional impact and human consequences of the issue
- Use vivid imagery and emotionally charged language
- Tell compelling stories that evoke strong feelings
- Focus on fear, hope, anger, compassion, or other powerful emotions
- Make the audience feel the stakes rather than just understand them intellectually`;

      case DebateTactic.APPEAL_TO_AUTHORITY:
        // Appeal to authority: cite authorities
        return `Appeal to Authority Technique:
- Cite experts, authorities, and prestigious sources to support your arguments
- Emphasize the credentials and reputation of those who agree with your position
- Use phrases like "Leading experts agree..." or "According to renowned scholars..."
- Leverage the weight of institutional or academic authority
- Suggest that disagreeing with these authorities is unreasonable`;

      case DebateTactic.FALSE_DILEMMA:
        // False dilemma: present only two options
        return `False Dilemma Technique:
- Present the issue as having only two possible options or outcomes
- Frame your position as the only reasonable alternative to an unacceptable option
- Use "either/or" language to eliminate middle ground
- Ignore nuance, compromise positions, or alternative solutions
- Make it appear that choosing anything other than your position leads to disaster`;

      case DebateTactic.SLIPPERY_SLOPE:
        // Slippery slope: chain of consequences
        return `Slippery Slope Technique:
- Argue that accepting your opponent's position will inevitably lead to extreme consequences
- Present a chain of events where each step leads inexorably to the next
- Emphasize the dire final outcome as if it's certain to occur
- Use phrases like "If we allow this, then next..." or "This is just the first step toward..."
- Make the progression seem inevitable and unstoppable`;

      case DebateTactic.RED_HERRING:
        // Red herring: introduce irrelevant topics
        return `Red Herring Technique:
- Introduce tangentially related but ultimately irrelevant topics
- Divert attention from your opponent's strongest arguments
- Shift the focus to issues where you have stronger ground
- Make the diversion seem relevant and important
- Use the distraction to avoid addressing difficult points directly`;

      case DebateTactic.NONE:
        // NONE: use only valid logical arguments
        return `Logical Argumentation Guidelines:
- Use only valid logical arguments and sound reasoning
- Avoid fallacious tactics and manipulative techniques
- Address your opponent's actual arguments without misrepresentation
- Focus on the strength of evidence and logical coherence
- Maintain intellectual honesty and argumentative integrity
- Build your case on solid reasoning rather than rhetorical tricks`;

      default:
        return '';
    }
  }

  /**
   * Builds a context reminder for personality traits to include in subsequent prompts.
   * This ensures personality consistency across rounds.
   * 
   * Requirements:
   * - 12.1: Include personality instructions in every prompt to that debater
   * - 12.3: Include reminders of the debater's personality profile in context
   * 
   * @param personality - The personality profile to remind about
   * @returns A brief reminder of the personality traits
   */
  buildContextReminder(personality: PersonalityProfile): string {
    const reminders: string[] = [];
    
    // Add civility reminder
    if (personality.civility >= 8) {
      reminders.push('Maintain respectful and courteous language');
    } else if (personality.civility <= 2) {
      reminders.push('Continue challenging arguments aggressively');
    } else {
      reminders.push('Balance respect with assertiveness');
    }
    
    // Add manner reminder
    if (personality.manner >= 8) {
      reminders.push('Use formal and professional language');
    } else if (personality.manner <= 2) {
      reminders.push('Continue using sharp and direct language');
    } else {
      reminders.push('Maintain conversational but firm tone');
    }
    
    // Add research depth reminder
    if (personality.researchDepth >= 8) {
      reminders.push('Continue citing sources and detailed evidence');
    } else if (personality.researchDepth <= 2) {
      reminders.push('Rely on general claims and common knowledge');
    } else {
      reminders.push('Balance evidence with broader arguments');
    }
    
    // Add rhetoric reminder
    if (personality.rhetoricUsage >= 8) {
      reminders.push('Continue employing emotional appeals and persuasive techniques');
    } else if (personality.rhetoricUsage <= 2) {
      reminders.push('Focus on logical arguments and evidence');
    } else {
      reminders.push('Blend logic with persuasive elements');
    }
    
    // Add tactics reminder if applicable
    if (personality.tactics && personality.tactics.length > 0 && 
        !(personality.tactics.length === 1 && personality.tactics[0] === DebateTactic.NONE)) {
      const tacticNames = personality.tactics
        .filter(t => t !== DebateTactic.NONE)
        .map(t => t.replace(/_/g, ' '))
        .join(', ');
      if (tacticNames) {
        reminders.push(`Continue using: ${tacticNames}`);
      }
    }
    
    return `Personality Reminders:\n- ${reminders.join('\n- ')}`;
  }

  /**
   * Calculates preparation time based on research depth.
   * High research depth increases preparation time to allow for more thorough research.
   * 
   * Requirements:
   * - 7.4: High research depth increases preparation time
   * 
   * @param basePreparationTime - The base preparation time in seconds
   * @param researchDepth - The research depth level (0-10)
   * @returns The adjusted preparation time in seconds
   */
  static calculatePreparationTime(basePreparationTime: number, researchDepth: number): number {
    // Research depth scale:
    // 0-2 (low): 0.8x base time (less time needed for superficial research)
    // 3-7 (moderate): 1.0x base time (standard time)
    // 8-10 (high): 1.5x base time (more time for detailed research)
    
    if (researchDepth >= 8) {
      // High research depth: increase preparation time by 50%
      return Math.round(basePreparationTime * 1.5);
    } else if (researchDepth <= 2) {
      // Low research depth: decrease preparation time by 20%
      return Math.round(basePreparationTime * 0.8);
    } else {
      // Moderate research depth: use base time
      return basePreparationTime;
    }
  }
}
