const fs = require('fs');
const content = fs.readFileSync('ai-tutor-full-expansion-prompt.md', 'utf8');

const blocks = [];
let inBlock = false;
let currentBlock = [];

const lines = content.split('\n');
for (const line of lines) {
  if (line.startsWith('```typescript')) {
    inBlock = true;
    currentBlock = [];
  } else if (line.startsWith('```') && inBlock) {
    // Only close if it's the start of the line or no text after
    if (line.trim() === '```') {
      inBlock = false;
      blocks.push(currentBlock.join('\n'));
    } else {
      currentBlock.push(line);
    }
  } else if (inBlock) {
    currentBlock.push(line);
  }
}

if (blocks.length >= 2) {
  fs.mkdirSync('apps/web/types', {recursive: true});
  fs.mkdirSync('apps/web/config', {recursive: true});
  fs.mkdirSync('apps/api/src/types', {recursive: true});
  fs.mkdirSync('apps/api/src/config', {recursive: true});
  
  fs.writeFileSync('apps/web/types/segment.ts', blocks[0].trim());
  fs.writeFileSync('apps/api/src/types/segment.ts', blocks[0].trim());
  
  let segTs = blocks[1].trim();
  segTs = segTs.replace(/@\/types\/segment/g, '../types/segment');
  
  fs.writeFileSync('apps/web/config/segments.ts', segTs);
  fs.writeFileSync('apps/api/src/config/segments.ts', segTs);
  
  console.log('Successfully wrote exact blocks!');
} else {
  console.log('Failed to parse blocks!');
}
