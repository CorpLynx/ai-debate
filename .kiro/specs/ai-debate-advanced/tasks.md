# Implementation Plan: AI Debate System - Advanced Features

- [ ] 1. Extend data models for advanced features
  - Add PersonalityProfile, DebateTactic, ModeratorContext, and related types to data models
  - Extend Debate model to EnhancedDebate with moderator and personality fields
  - Add ModeratorReview, RuleViolation, ModeratorIntervention types
  - Update DebateConfig to include moderator and personality options
  - _Requirements: All requirements depend on proper data models_

- [ ] 2. Implement PersonalityProfile validation
  - Create validation function for personality profiles
  - Validate trait values are in 0-10 range
  - Validate tactics are from valid DebateTactic enum
  - Validate required dimensions are present
  - _Requirements: 3.4_

- [ ] 2.1 Write property test for personality validation
  - **Property 13: Invalid personality profiles rejected**
  - **Validates: Requirements 3.4**

- [ ] 3. Implement PersonalityGenerator class
  - Create PersonalityGenerator with random generation method
  - Implement generateRandom() to create valid random profiles
  - Ensure all dimensions (civility, manner, researchDepth, rhetoricUsage) are included
  - Ensure generated profiles pass validation
  - _Requirements: 4.1, 4.2, 4.4_

- [ ] 3.1 Write property test for random personality generation
  - **Property 14: Random personality generation produces valid profiles**
  - **Validates: Requirements 4.1, 4.2, 4.4**

- [ ] 4. Implement personality profile persistence
  - Add saveProfile method to PersonalityGenerator
  - Add loadProfile method to PersonalityGenerator
  - Add listProfiles method to PersonalityGenerator
  - Store profiles as JSON files in profiles directory
  - _Requirements: 11.1, 11.2, 11.4_

- [ ] 4.1 Write property test for profile storage round-trip
  - **Property 25: Personality profile storage round-trip**
  - **Validates: Requirements 11.1, 11.3**

- [ ] 4.2 Write property test for saved profiles availability
  - **Property 26: Saved profiles available for selection**
  - **Validates: Requirements 11.2, 11.4**

- [ ] 5. Implement default personality profile
  - Create getDefaultProfile method returning neutral personality
  - Set all traits to moderate values (5)
  - Set tactics to empty array or NONE
  - _Requirements: 3.3_

- [ ] 5.1 Write property test for default personality
  - **Property 12: Default personality when none specified**
  - **Validates: Requirements 3.3**

- [ ] 6. Implement PromptBuilder class
  - Create PromptBuilder with methods for constructing system prompts
  - Implement buildDebaterPrompt method
  - Implement buildModeratorPrompt method
  - Create base prompt templates
  - _Requirements: 3.1, 3.2_

- [ ] 7. Implement civility trait prompt instructions
  - Create getCivilityInstructions method mapping civility values to prompt text
  - High civility (8-10): respectful language, acknowledge valid points
  - Low civility (0-2): dismissive language, aggressive challenges
  - Moderate civility (3-7): balanced respect and assertiveness
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7.1 Write property test for civility trait in prompts
  - **Property 16: Civility trait affects prompt instructions**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [ ] 8. Implement manner trait prompt instructions
  - Create getMannerInstructions method mapping manner values to prompt text
  - Well-mannered (8-10): formal language, avoid personal attacks
  - Abrasive (0-2): sharp language, direct confrontation
  - Moderate manner (3-7): conversational but firm language
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 8.1 Write property test for manner trait in prompts
  - **Property 17: Manner trait affects prompt instructions**
  - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ] 9. Implement trait blending in prompts
  - Implement addPersonalityInstructions method that combines all traits
  - Ensure civility and manner traits are both included
  - Blend instructions without conflicts
  - _Requirements: 6.4_

- [ ] 9.1 Write property test for multiple traits blended
  - **Property 18: Multiple traits blended in prompt**
  - **Validates: Requirements 6.4**

- [ ] 10. Implement research depth trait prompt instructions
  - Create getResearchInstructions method mapping research values to prompt text
  - High research (8-10): cite sources, use data, detailed evidence
  - Low research (0-2): general claims, common knowledge
  - Moderate research (3-7): balance evidence with broader arguments
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 11. Implement research depth affecting preparation time
  - Modify debate configuration to adjust preparation time based on research depth
  - High research depth increases preparation time
  - _Requirements: 7.4_

- [ ] 11.1 Write property test for research depth effects
  - **Property 19: Research depth affects prompt and preparation time**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [ ] 12. Implement rhetoric usage trait prompt instructions
  - Create getRhetoricInstructions method mapping rhetoric values to prompt text
  - Low rhetoric (0-2): focus on logical arguments and evidence
  - High rhetoric (8-10): emotional appeals, analogies, persuasive techniques
  - Moderate rhetoric (3-7): blend logic with persuasive elements
  - Include examples of acceptable rhetorical techniques
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 12.1 Write property test for rhetoric usage in prompts
  - **Property 20: Rhetoric usage affects prompt instructions**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [ ] 13. Implement debate tactic prompt instructions
  - Create addTacticGuidelines method that adds tactic-specific instructions
  - Map each DebateTactic to specific instructions
  - Gish gallop: present multiple arguments rapidly
  - Strawman: misrepresent then refute
  - Ad hominem: attack character/credibility
  - Appeal to emotion: emphasize emotional impact
  - NONE: use only valid logical arguments
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 13.1 Write property test for debate tactics in prompts
  - **Property 21: Debate tactics included in prompt**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [ ] 14. Implement personality consistency across rounds
  - Implement buildContextReminder method for personality reminders
  - Ensure personality instructions included in every debater prompt
  - Add personality reminders to context for each round
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 14.1 Write property test for personality in all prompts
  - **Property 11: Personality profile applied to system prompt**
  - **Validates: Requirements 3.1, 3.2, 12.1, 12.2**

- [ ] 14.2 Write property test for personality reminders in context
  - **Property 27: Personality reminders in context**
  - **Validates: Requirements 12.3**

- [ ] 15. Implement ModeratorManager class
  - Create ModeratorManager with moderator coordination methods
  - Implement initializeModerator method
  - Implement introduceRound method
  - Implement reviewStatement method
  - Implement provideRoundCommentary method
  - Implement generateDebateSummary method
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 16. Implement moderator model selection
  - Extend model selection logic to select third model when moderator enabled
  - Ensure three distinct models selected (two debaters + moderator)
  - _Requirements: 1.1_

- [ ] 16.1 Write property test for moderator model selection
  - **Property 1: Moderator model selection when enabled**
  - **Validates: Requirements 1.1**

- [ ] 17. Implement moderator initialization with rules
  - Build moderator system prompt including debate rules and format
  - Provide rules and format instructions to moderator
  - _Requirements: 1.2_

- [ ] 17.1 Write property test for moderator receives rules
  - **Property 2: Moderator receives rules and format**
  - **Validates: Requirements 1.2**

- [ ] 18. Implement moderator round introductions
  - Prompt moderator to introduce each round before debaters speak
  - Display moderator introduction to user
  - _Requirements: 1.3_

- [ ] 18.1 Write property test for moderator introduces rounds
  - **Property 3: Moderator introduces each round**
  - **Validates: Requirements 1.3**

- [ ] 19. Implement moderator round commentary
  - Prompt moderator for commentary after both debaters speak in a round
  - Include argument evaluation, effective techniques, and missed opportunities
  - Display commentary to user
  - _Requirements: 1.4, 14.1, 14.2, 14.3_

- [ ] 19.1 Write property test for moderator round commentary
  - **Property 4: Moderator provides round commentary**
  - **Validates: Requirements 1.4**

- [ ] 19.2 Write property test for commentary elements
  - **Property 30: Moderator commentary includes required elements**
  - **Validates: Requirements 14.1, 14.2, 14.3**

- [ ] 20. Implement moderator debate summary
  - Prompt moderator for final summary when debate completes
  - Include overall assessment of both debaters' performance
  - Display summary to user
  - _Requirements: 1.5, 14.4_

- [ ] 20.1 Write property test for moderator summary
  - **Property 5: Moderator provides debate summary**
  - **Validates: Requirements 1.5**

- [ ] 20.2 Write property test for overall assessment
  - **Property 31: Moderator provides overall assessment**
  - **Validates: Requirements 14.4**

- [ ] 21. Implement statement review by moderator
  - Submit each debater statement to moderator for review
  - Prompt moderator to identify rule violations, tactics, and fallacies
  - Return ModeratorReview with findings
  - _Requirements: 2.1, 10.1, 10.2_

- [ ] 21.1 Write property test for statements submitted for review
  - **Property 6: Statements submitted for moderator review**
  - **Validates: Requirements 2.1**

- [ ] 21.2 Write property test for moderator identifies fallacies and tactics
  - **Property 22: Moderator identifies fallacies and tactics**
  - **Validates: Requirements 10.1, 10.2**

- [ ] 22. Implement rule violation recording
  - Store violations from moderator review in debate state
  - Include moderator's explanation with each violation
  - Track violations per debater
  - _Requirements: 2.2_

- [ ] 22.1 Write property test for violations recorded
  - **Property 7: Rule violations are recorded**
  - **Validates: Requirements 2.2**

- [ ] 23. Implement moderator interventions
  - Prompt moderator to issue warning or intervention when violations detected
  - Create ModeratorIntervention with type, target, and message
  - Display intervention to user
  - _Requirements: 2.3, 2.5_

- [ ] 23.1 Write property test for violations trigger interventions
  - **Property 8: Violations trigger intervention prompts**
  - **Validates: Requirements 2.3**

- [ ] 23.2 Write property test for interventions displayed
  - **Property 10: Interventions are displayed**
  - **Validates: Requirements 2.5**

- [ ] 24. Implement intervention escalation
  - Implement escalateIntervention method
  - Provide violation history to moderator when prompting for intervention
  - Allow moderator to escalate from warning to correction to penalty
  - _Requirements: 2.4_

- [ ] 24.1 Write property test for violation escalation
  - **Property 9: Violation escalation with history**
  - **Validates: Requirements 2.4**

- [ ] 25. Implement fallacy and tactic identification in commentary
  - Include identified fallacies and tactics in moderator commentary
  - Display tactical analysis and fallacy reports
  - _Requirements: 10.3_

- [ ] 25.1 Write property test for identifications in commentary
  - **Property 23: Fallacy and tactic identifications in commentary**
  - **Validates: Requirements 10.3**

- [ ] 26. Implement distinction between violations and observations
  - Format display to distinguish rule violations from tactical observations
  - Use different visual indicators (e.g., ⚠ for violations, 💡 for observations)
  - _Requirements: 10.4_

- [ ] 26.1 Write property test for violations and observations distinguished
  - **Property 24: Violations and observations distinguished**
  - **Validates: Requirements 10.4**

- [ ] 27. Implement moderator strictness levels
  - Create getStrictnessInstructions method mapping strictness to prompt text
  - Strict: intervene on minor violations
  - Lenient: only major violations
  - Moderate: balanced enforcement
  - Include strictness guidelines in moderator system prompt
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 27.1 Write property test for moderator strictness
  - **Property 29: Moderator strictness affects prompt**
  - **Validates: Requirements 13.1, 13.2, 13.3, 13.4**

- [ ] 28. Implement moderator disabled mode
  - When moderator disabled, select only two AI models
  - Skip moderator prompts and proceed directly between rounds
  - Produce no moderator interventions or commentary
  - _Requirements: 15.1, 15.2, 15.3_

- [ ] 28.1 Write property test for moderator disabled behavior
  - **Property 32: Moderator disabled behavior**
  - **Validates: Requirements 15.1, 15.2, 15.3**

- [ ] 29. Implement moderator configuration validation
  - Validate moderator settings when configuration changes
  - Notify user of resulting debate format (moderated vs unmoderated)
  - _Requirements: 15.4_

- [ ] 29.1 Write property test for moderator configuration validation
  - **Property 33: Moderator configuration validated**
  - **Validates: Requirements 15.4**

- [ ] 30. Integrate personalities into debate orchestrator
  - Extend debate initialization to accept personality profiles
  - Apply personalities when building debater prompts
  - Use default personality when none specified
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 31. Implement personality display before debate
  - When random personalities generated, display profiles to user
  - Show trait values and tactics for each debater
  - _Requirements: 4.3_

- [ ] 31.1 Write property test for personalities displayed
  - **Property 15: Generated personalities displayed before debate**
  - **Validates: Requirements 4.3**

- [ ] 32. Integrate moderator into debate flow
  - Extend EnhancedDebateOrchestrator to coordinate moderator interactions
  - Implement executeRoundWithModerator method
  - Call moderator for introductions, reviews, and commentary at appropriate times
  - Handle moderator interventions in debate flow
  - _Requirements: 1.3, 1.4, 2.1, 2.3_

- [ ] 33. Implement personality profiles in transcript
  - Extend transcript generation to include personality profiles
  - Add affirmativePersonality and negativePersonality to transcript metadata
  - Preserve personality information in saved transcripts
  - _Requirements: 12.4_

- [ ] 33.1 Write property test for personalities in transcript
  - **Property 28: Personality profiles in transcript**
  - **Validates: Requirements 12.4**

- [ ] 34. Create personality profile presets
  - Implement common preset profiles (Academic Scholar, Firebrand Activist, etc.)
  - Store presets in profiles directory
  - Make presets available for selection
  - _Requirements: 11.2_

- [ ] 35. Extend CLI for personality selection
  - Add CLI options for specifying personalities (--aff-personality, --neg-personality)
  - Support preset names, saved profile names, 'random', and 'default'
  - Add --random-personalities flag for both debaters
  - Display personality selection UI when interactive
  - _Requirements: 3.1, 4.1, 11.2_

- [ ] 36. Extend CLI for moderator options
  - Add --moderator flag to enable moderator
  - Add --strictness option for moderator strictness level
  - Add --no-moderator flag to explicitly disable
  - Display moderator status in debate output
  - _Requirements: 1.1, 13.1, 15.1_

- [ ] 37. Extend CLI for debate tactics
  - Add --aff-tactics and --neg-tactics options
  - Support comma-separated list of tactics
  - Validate tactic names against DebateTactic enum
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 38. Implement enhanced debate output formatting
  - Add visual indicators for moderator commentary
  - Use colors to distinguish moderator, affirmative, negative
  - Format violations and observations differently
  - Display personality traits at debate start
  - _Requirements: 2.5, 10.4_

- [ ] 39. Implement profile management CLI commands
  - Add 'ai-debate profiles list' command
  - Add 'ai-debate profiles show <name>' command
  - Add 'ai-debate profiles delete <name>' command
  - _Requirements: 11.4_

- [ ] 40. Add error handling for personality errors
  - Handle invalid personality profiles gracefully
  - Handle profile save/load failures
  - Handle missing profile files
  - Provide clear error messages
  - _Requirements: 3.4, 11.1, 11.3_

- [ ] 41. Add error handling for moderator errors
  - Handle moderator model unavailable (fall back to unmoderated)
  - Handle moderator response failures (continue without that interaction)
  - Handle moderator timeouts (skip interaction)
  - Log errors and notify user
  - _Requirements: 1.1, 1.3, 1.4_

- [ ] 42. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 43. Write unit tests for PersonalityGenerator
  - Test random generation produces valid profiles
  - Test validation rejects invalid profiles
  - Test save/load operations
  - Test preset profiles
  - _Requirements: 3.4, 4.1, 11.1, 11.3_

- [ ] 44. Write unit tests for PromptBuilder
  - Test prompt construction with various personality combinations
  - Test trait instruction generation for each dimension
  - Test tactic guideline generation
  - Test trait blending
  - _Requirements: 3.1, 5.1-5.4, 6.1-6.4, 7.1-7.4, 8.1-8.4, 9.1-9.5_

- [ ] 45. Write unit tests for ModeratorManager
  - Test moderator initialization
  - Test statement review processing
  - Test intervention generation
  - Test escalation logic
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4_

- [ ] 46. Write unit tests for EnhancedDebateOrchestrator
  - Test moderator integration into debate flow
  - Test round execution with moderator
  - Test moderator disabled mode
  - _Requirements: 1.3, 1.4, 15.1, 15.2, 15.3_

- [ ] 47. Write integration test for moderated debate with personalities
  - Test complete debate with moderator enabled and custom personalities
  - Verify all moderator interactions occur
  - Verify personality traits affect debate behavior
  - Verify transcript includes all advanced features
  - _Requirements: All requirements_

- [ ] 48. Write integration test for moderator interventions
  - Test debate with rule violations
  - Verify moderator detects violations
  - Verify interventions are issued and escalated
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 49. Write integration test for personality profile management
  - Test creating, saving, loading, and reusing profiles
  - Test profile persistence across multiple debates
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 50. Add documentation for advanced features
  - Document personality system and trait dimensions
  - Document moderator functionality and strictness levels
  - Document debate tactics and their effects
  - Provide examples of debates with different configurations
  - Document CLI options for advanced features
  - _Requirements: All requirements_

- [ ] 51. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
