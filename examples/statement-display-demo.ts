/**
 * Demo script showing the statement display functionality
 * Run with: npx ts-node examples/statement-display-demo.ts
 */

import { formatStatement, formatThinkingIndicator } from '../src/utils/StatementFormatter';
import { Statement } from '../src/models/Statement';
import { Position } from '../src/models/Position';
import { RoundType } from '../src/models/RoundType';

// Example statements
const affirmativeOpening: Statement = {
  model: 'GPT-4',
  position: Position.AFFIRMATIVE,
  content: `Artificial intelligence represents one of the most transformative technologies of our time. 
The benefits of AI far outweigh the risks, and we should embrace its development.

First, AI has the potential to solve some of humanity's greatest challenges, from climate change 
to disease. Second, AI can augment human capabilities rather than replace them. Finally, with 
proper regulation and ethical guidelines, we can mitigate the risks while maximizing the benefits.`,
  wordCount: 67,
  generatedAt: new Date()
};

const negativeRebuttal: Statement = {
  model: 'Claude',
  position: Position.NEGATIVE,
  content: `While my opponent makes compelling points about AI's potential benefits, they overlook 
the significant risks that cannot be easily mitigated through regulation alone.

The existential risks posed by advanced AI systems are not hypothetical - they are real concerns 
shared by leading AI researchers. Furthermore, the displacement of human workers and the 
concentration of power in the hands of a few tech companies pose serious societal challenges 
that we must address before rushing headlong into AI development.`,
  wordCount: 73,
  generatedAt: new Date()
};

console.log('\n=== AI Debate System - Statement Display Demo ===\n');

// Show thinking indicator
console.log(formatThinkingIndicator('GPT-4', Position.AFFIRMATIVE, RoundType.OPENING));

// Show formatted opening statement
console.log(formatStatement(affirmativeOpening, RoundType.OPENING));

// Show thinking indicator for rebuttal
console.log(formatThinkingIndicator('Claude', Position.NEGATIVE, RoundType.REBUTTAL));

// Show formatted rebuttal
console.log(formatStatement(negativeRebuttal, RoundType.REBUTTAL));

console.log('\n=== Demo Complete ===\n');
