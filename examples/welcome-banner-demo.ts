/**
 * Demo script to display the enhanced welcome banner
 * 
 * Run with: npx ts-node examples/welcome-banner-demo.ts
 */

import { displayWelcomeBanner } from '../src/utils/DisplayUtils';
import { DEFAULT_COLOR_SCHEME } from '../src/models/ColorScheme';

console.log('=== Welcome Banner Demo ===\n');

console.log('1. Standard Welcome Banner:');
console.log(displayWelcomeBanner({
  colorScheme: DEFAULT_COLOR_SCHEME,
  animated: false
}));

console.log('\n\n2. Welcome Banner with Animation Indicator:');
console.log(displayWelcomeBanner({
  colorScheme: DEFAULT_COLOR_SCHEME,
  animated: true
}));

console.log('\n=== Demo Complete ===');
