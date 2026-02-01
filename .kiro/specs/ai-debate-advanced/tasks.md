# Implementation Plan: AI Debate System - Dynamic Debater Personalities

- [x] 1. Extend data models for personality features
  - Add PersonalityProfile and DebateTactic types to data models
  - Extend Debate model to include personality fields
  - Update DebateConfig to include personality options
  - _Requirements: All requirements depend on proper data models_

- [x] 2. Implement PersonalityProfile validation
  - Create validation function for personality profiles
  - Validate trait values are in 0-10 range
  - Validate tactics are from valid DebateTactic enum
  - Validate required dimensions are present
  - _Requirements: 3.4_

- [x] 2.1 Write property test for personality validation
  - **Property 13: Invalid personality profiles rejected**
  - **Validates: Requirements 3.4**

- [x] 3. Implement PersonalityGenerator class
  - Create PersonalityGenerator with random generation method
  - Implement generateRandom() to create valid random profiles
  - Ensure all dimensions (civility, manner, researchDepth, rhetoricUsage) are included
  - Ensure generated profiles pass validation
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 3.1 Write property test for random personality generation
  - **Property 14: Random personality generation produces valid profiles**
  - **Validates: Requirements 4.1, 4.2, 4.4**

- [x] 4. Implement default personality profile
  - Create getDefaultProfile method returning neutral personality
  - Set all traits to moderate values (5)
  - Set tactics to empty array or NONE
  - _Requirements: 3.3_

- [x] 4.1 Write property test for default personality
  - **Property 12: Default personality when none specified**
  - **Validates: Requirements 3.3**

- [x] 5. Implement PromptBuilder class
  - Create PromptBuilder with methods for constructing system prompts
  - Implement buildDebaterPrompt method
  - Create base prompt templates
  - _Requirements: 3.1, 3.2_

- [x] 6. Implement civility trait prompt instructions
  - Create getCivilityInstructions method mapping civility values to prompt text
  - High civility (8-10): respectful language, acknowledge valid points
  - Low civility (0-2): dismissive language, aggressive challenges
  - Moderate civility (3-7): balanced respect and assertiveness
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 6.1 Write property test for civility trait in prompts
  - **Property 16: Civility trait affects prompt instructions**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 7. Implement manner trait prompt instructions
  - Create getMannerInstructions method mapping manner values to prompt text
  - Well-mannered (8-10): formal language, avoid personal attacks
  - Abrasive (0-2): sharp language, direct confrontation
  - Moderate manner (3-7): conversational but firm language
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 7.1 Write property test for manner trait in prompts
  - **Property 17: Manner trait affects prompt instructions**
  - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 8. Implement trait blending in prompts
  - Implement addPersonalityInstructions method that combines all traits
  - Ensure civility and manner traits are both included
  - Blend instructions without conflicts
  - _Requirements: 6.4_

- [x] 8.1 Write property test for multiple traits blended
  - **Property 18: Multiple traits blended in prompt**
  - **Validates: Requirements 6.4**

- [x] 9. Implement research depth trait prompt instructions
  - Create getResearchInstructions method mapping research values to prompt text
  - High research (8-10): cite sources, use data, detailed evidence
  - Low research (0-2): general claims, common knowledge
  - Moderate research (3-7): balance evidence with broader arguments
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 10. Implement research depth affecting preparation time
  - Modify debate configuration to adjust preparation time based on research depth
  - High research depth increases preparation time
  - _Requirements: 7.4_

- [x] 10.1 Write property test for research depth effects
  - **Property 19: Research depth affects prompt and preparation time**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 11. Implement rhetoric usage trait prompt instructions
  - Create getRhetoricInstructions method mapping rhetoric values to prompt text
  - Low rhetoric (0-2): focus on logical arguments and evidence
  - High rhetoric (8-10): emotional appeals, analogies, persuasive techniques
  - Moderate rhetoric (3-7): blend logic with persuasive elements
  - Include examples of acceptable rhetorical techniques
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 11.1 Write property test for rhetoric usage in prompts
  - **Property 20: Rhetoric usage affects prompt instructions**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [x] 12. Implement debate tactic prompt instructions
  - Create addTacticGuidelines method that adds tactic-specific instructions
  - Map each DebateTactic to specific instructions
  - Gish gallop: present multiple arguments rapidly
  - Strawman: misrepresent then refute
  - Ad hominem: attack character/credibility
  - Appeal to emotion: emphasize emotional impact
  - NONE: use only valid logical arguments
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 12.1 Write property test for debate tactics in prompts
  - **Property 21: Debate tactics included in prompt**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [x] 13. Implement personality consistency across rounds
  - Implement buildContextReminder method for personality reminders
  - Ensure personality instructions included in every debater prompt
  - Add personality reminders to context for each round
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 13.1 Write property test for personality in all prompts
  - **Property 11: Personality profile applied to system prompt**
  - **Validates: Requirements 3.1, 3.2, 12.1, 12.2**

- [x] 13.2 Write property test for personality reminders in context
  - **Property 27: Personality reminders in context**
  - **Validates: Requirements 12.3**

- [x] 14. Integrate personalities into debate orchestrator
  - Extend debate initialization to accept personality profiles
  - Apply personalities when building debater prompts
  - Automatically generate random personalities for each debate
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 15. Implement personality profiles in transcript
  - Extend transcript generation to include personality profiles
  - Add affirmativePersonality and negativePersonality to transcript metadata
  - Preserve personality information in saved transcripts
  - _Requirements: 12.4_

- [x] 15.1 Write property test for personalities in transcript
  - **Property 28: Personality profiles in transcript**
  - **Validates: Requirements 12.4**

- [x] 16. Add error handling for personality errors
  - Handle invalid personality profiles gracefully
  - Provide clear error messages
  - _Requirements: 3.4_

- [x] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Write unit tests for PersonalityGenerator
  - Test random generation produces valid profiles
  - Test validation rejects invalid profiles
  - _Requirements: 3.4, 4.1_

- [x] 19. Write unit tests for PromptBuilder
  - Test prompt construction with various personality combinations
  - Test trait instruction generation for each dimension
  - Test tactic guideline generation
  - Test trait blending
  - _Requirements: 3.1, 5.1-5.4, 6.1-6.4, 7.1-7.4, 8.1-8.4, 9.1-9.5_

- [x] 20. Write integration test for debate with dynamic personalities
  - Test complete debate with randomly generated personalities
  - Verify personality traits affect debate behavior
  - Verify transcript includes personality profiles
  - _Requirements: All requirements_

- [x] 21. Add documentation for personality features
  - Document personality system and trait dimensions
  - Document debate tactics and their effects
  - Provide examples of debates with different personality configurations
  - _Requirements: All requirements_

- [x] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
