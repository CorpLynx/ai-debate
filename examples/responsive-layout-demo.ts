import { ResponsiveLayout, wrapText, createBox } from '../src/utils/ResponsiveLayout';
import { BoxStyle } from '../src/models/FormattingRules';
import { DEFAULT_COLOR_SCHEME } from '../src/models/ColorScheme';

console.log('=== ResponsiveLayout Demo ===\n');

const layout = new ResponsiveLayout(DEFAULT_COLOR_SCHEME);

// Demo 1: Terminal size detection
console.log('1. Terminal Size Detection:');
const size = layout.getTerminalSize();
console.log(`   Width: ${size.width}, Height: ${size.height}`);
console.log(`   Is Narrow: ${size.isNarrow}, Is Wide: ${size.isWide}\n`);

// Demo 2: Text wrapping
console.log('2. Text Wrapping (40 chars width):');
const longText = 'This is a very long line of text that demonstrates the text wrapping functionality of the ResponsiveLayout component. It should wrap nicely at the specified width.';
const wrapped = wrapText(longText, 40, 0);
console.log(wrapped);
console.log();

// Demo 3: Text wrapping with indentation
console.log('3. Text Wrapping with Indentation (40 chars, 4 space indent):');
const indented = wrapText(longText, 40, 4);
console.log(indented);
console.log();

// Demo 4: Box creation
console.log('4. Simple Box:');
const simpleBox = createBox('This is content inside a box', { style: BoxStyle.ROUNDED });
console.log(simpleBox);
console.log();

// Demo 5: Box with title
console.log('5. Box with Title:');
const titleBox = createBox('Important information goes here', { 
  title: 'Notice', 
  style: BoxStyle.DOUBLE,
  width: 60
});
console.log(titleBox);
console.log();

// Demo 6: Adaptive formatting
console.log('6. Adaptive Formatting:');
const content = 'This content will be automatically formatted based on the current terminal size, with appropriate wrapping and spacing.';
const adapted = layout.adaptFormatting(content);
console.log(adapted);
console.log();

// Demo 7: Different box styles
console.log('7. Different Box Styles:');
const styles = [BoxStyle.SINGLE, BoxStyle.DOUBLE, BoxStyle.ROUNDED, BoxStyle.HEAVY];
for (const style of styles) {
  const box = createBox(`${style} style`, { style, width: 30 });
  console.log(box);
  console.log();
}

console.log('=== Demo Complete ===');
