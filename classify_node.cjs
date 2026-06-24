const fs = require('fs');
const path = require('path');

// Read questionBank.ts
const filePath = path.join(__dirname, 'src', 'data', 'questionBank.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Extract the questionBank array by evaluating the relevant part
// Strategy: extract the array string and parse it

// Remove exports and type definitions, then eval the array
// Step 1: Extract everything between export const questionBank: Question[] = [ and the final ];
const startMarker = 'export const questionBank: Question[] = [';
const startIndex = content.indexOf(startMarker);

if (startIndex === -1) {
  console.error('Could not find questionBank array');
  process.exit(1);
}

// Find the matching closing bracket
let braceCount = 0;
let inString = false;
let stringChar = '';
let escaped = false;
let endIndex = -1;
let i = startIndex + startMarker.length;

for (; i < content.length; i++) {
  const ch = content[i];
  
  if (escaped) {
    escaped = false;
    continue;
  }
  
  if (ch === '\\') {
    escaped = true;
    continue;
  }
  
  if (inString) {
    if (ch === stringChar) {
      inString = false;
    }
    continue;
  }
  
  if (ch === "'" || ch === '"' || ch === '`') {
    inString = true;
    stringChar = ch;
    continue;
  }
  
  if (ch === '{') braceCount++;
  if (ch === '}') braceCount--;
  
  if (braceCount < 0) {
    endIndex = i;
    break;
  }
}

if (endIndex === -1) {
  console.error('Could not find end of questionBank array');
  process.exit(1);
}

const arrayStr = content.substring(startIndex + startMarker.length, endIndex).trim();

// Now parse each question object
// Use a simpler approach: split by '},\n  {' pattern
const questionBlocks = [];
let currentBlock = '';
let depth = 0;
let inStr = false;
let strCh = '';
let esc = false;

for (let j = 0; j < arrayStr.length; j++) {
  const ch = arrayStr[j];
  
  if (esc) { esc = false; currentBlock += ch; continue; }
  if (ch === '\\') { esc = true; currentBlock += ch; continue; }
  
  if (inStr) {
    if (ch === strCh) inStr = false;
    currentBlock += ch;
    continue;
  }
  
  if (ch === "'" || ch === '"' || ch === '`') {
    inStr = true;
    strCh = ch;
    currentBlock += ch;
    continue;
  }
  
  if (ch === '{') {
    if (depth === 0) currentBlock = '';
    depth++;
  }
  if (ch === '}') {
    depth--;
    if (depth === 0) {
      currentBlock += ch;
      questionBlocks.push(currentBlock.trim());
      currentBlock = '';
      // skip comma and whitespace
      while (j + 1 < arrayStr.length && ' ,\n\t'.includes(arrayStr[j + 1])) j++;
      continue;
    }
  }
  
  if (depth > 0 || (currentBlock === '' && ch === '{')) {
    currentBlock += ch;
  }
}

console.log(`Found ${questionBlocks.length} question blocks`);

// Parse each block into an object
function parseBlock(block) {
  const obj = {};
  
  // Extract id
  let m = block.match(/id:\s*'([^']+)'/);
  if (m) obj.id = m[1];
  
  // Extract grade
  m = block.match(/grade:\s*(\d+)/);
  if (m) obj.grade = parseInt(m[1]);
  
  // Extract type
  m = block.match(/type:\s*'([^']+)'/);
  if (m) obj.type = m[1];
  
  // Extract question (may be multi-line)
  m = block.match(/question:\s*'([\s\S]*?)'(?=\s*,\s*(?:answer|explanation|tags))/);
  if (m) {
    obj.question = m[1].replace(/\\n/g, '\n').replace(/\\'/g, "'");
  } else {
    // Try another pattern
    m = block.match(/question:\s*'([\s\S]*?)'\s*,\s*tags/);
    if (m) obj.question = m[1].replace(/\\n/g, '\n').replace(/\\'/g, "'");
  }
  
  // Extract answer
  m = block.match(/answer:\s*'([\s\S]*?)'(?=\s*,\s*(?:explanation|tags|\}))/);
  if (m) {
    obj.answer = m[1].replace(/\\n/g, '\n').replace(/\\'/g, "'");
  }
  
  // Extract explanation
  m = block.match(/explanation:\s*'([\s\S]*?)'\s*,\s*tags/);
  if (m) obj.explanation = m[1].replace(/\\n/g, '\n').replace(/\\'/g, "'");
  else obj.explanation = '';
  
  // Extract tags
  m = block.match(/tags:\s*\[([^\]]*)\]/);
  if (m) obj.tags = m[1];
  else obj.tags = '';
  
  return obj;
}

const questions = questionBlocks.map(parseBlock).filter(q => q.id);

console.log(`Parsed ${questions.length} questions`);

if (questions.length === 0) {
  console.error('No questions parsed! Check the parsing logic.');
  console.log('First block:', questionBlocks[0]);
  process.exit(1);
}

// Classification function
function classifyQuestion(qText) {
  const text = qText.toLowerCase();
  
  // Writing - highest priority
  if (text.includes('写话') || text.includes('作文') || text.includes('写作') || 
      text.includes('看图写') || text.includes('习作') || text.includes('我的写话')) {
    return 'writing';
  }
  
  // Reading - has reading passage features
  if ((text.includes('阅读') && text.includes('题')) || 
      text.includes('阅读短文') || text.includes('阅读习题') || 
      text.includes('自然段') || text.includes('文中提到') ||
      text.includes('这篇短文') || (text.includes('阅读') && text.length > 100)) {
    return 'reading';
  }
  
  // Pinyin
  if (text.includes('拼音') || text.includes('声母') || text.includes('韵母') || 
      text.includes('音节') || text.includes('标拼音') || text.includes('读拼音') ||
      text.includes('整体认读') || text.includes('声调') || text.includes('拼读')) {
    return 'pinyin';
  }
  
  // Character
  if (text.includes('笔画') || text.includes('笔顺') || text.includes('偏旁') ||
      text.includes('部首') || text.includes('错别字') || text.includes('汉字') ||
      text.includes('加偏旁') || text.includes('换偏旁') || text.includes('识字') ||
      text.includes('写字') || text.includes('按笔顺')) {
    return 'character';
  }
  
  // Word
  if (text.includes('词语') || text.includes('反义词') || text.includes('近义词') ||
      text.includes('量词') || text.includes('aabb') || text.includes('词语搭配') ||
      text.includes('组词') || text.includes('填词') || text.includes('选词') ||
      text.includes('成语')) {
    return 'word';
  }
  
  // Sentence
  if (text.includes('句子') || text.includes('造句') || text.includes('连词成句') ||
      text.includes('扩句') || text.includes('感叹句') || text.includes('标点') ||
      text.includes('修辞') || text.includes('病句') || text.includes('改写句子') ||
      text.includes('补全句子') || text.includes('句子练习')) {
    return 'sentence';
  }
  
  // Default
  if (text.length > 150) return 'reading';
  return 'word';
}

// Classify all questions
const typeLabels = {
  pinyin: '拼音',
  character: '识字写字',
  word: '词语理解',
  sentence: '句子练习',
  reading: '阅读理解',
  writing: '写作练习'
};

const counts = { pinyin: 0, character: 0, word: 0, sentence: 0, reading: 0, writing: 0 };

questions.forEach(q => {
  q.newType = classifyQuestion(q.question || '');
  counts[q.newType]++;
});

console.log('\n分类结果：');
Object.entries(typeLabels).forEach(([key, label]) => {
  console.log(`  ${label}: ${counts[key]} 道`);
});

// Show samples for verification
console.log('\n样本检查（每类前2道）：');
Object.keys(typeLabels).forEach(type => {
  const samples = questions.filter(q => q.newType === type).slice(0, 2);
  if (samples.length > 0) {
    console.log(`\n[${typeLabels[type]}]`);
    samples.forEach(q => {
      const preview = (q.question || '').replace(/\n/g, ' ').substring(0, 60);
      console.log(`  ${q.id}: ${preview}...`);
    });
  }
});

// Save to JSON
fs.writeFileSync('fixed_questions.json', JSON.stringify(questions, null, 2), 'utf-8');
console.log('\n已保存到 fixed_questions.json');
