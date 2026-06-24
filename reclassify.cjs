/**
 * 用 Node.js 读取 questionBank.ts，重新分类，输出新文件
 * 用法: node reclassify.cjs
 */

const fs = require('fs');
const path = require('path');

// 读取 questionBank.ts
const filePath = path.join(__dirname, 'src', 'data', 'questionBank.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 提取 questionBank 数组：找到第一个 [ 和最后一个 ] 之间的内容
const arrStart = content.indexOf('export const questionBank: Question[] = [');
if (arrStart === -1) {
  console.error('找不到 questionBank 数组');
  process.exit(1);
}

// 从 arrStart 开始，找到匹配的右括号
let startIdx = arrStart + 'export const questionBank: Question[] = '.length;
let bracketCount = 0;
let inString = false;
let strChar = '';
let escaped = false;
let endIdx = -1;

for (let i = startIdx; i < content.length; i++) {
  const ch = content[i];
  if (escaped) { escaped = false; continue; }
  if (ch === '\\') { escaped = true; continue; }
  if (inString) {
    if (ch === strChar) inString = false;
    continue;
  }
  if (ch === "'" || ch === '"' || ch === '`') {
    inString = true;
    strChar = ch;
    continue;
  }
  if (ch === '[') bracketCount++;
  if (ch === ']') {
    bracketCount--;
    if (bracketCount === 0) { endIdx = i; break; }
  }
}

if (endIdx === -1) {
  console.error('找不到数组结束位置');
  process.exit(1);
}

const arrStr = content.substring(startIdx, endIdx + 1);

// 现在 arrStr 是有效的 JS 数组字面量，直接用 eval
const questionBank = eval(arrStr);
console.log(`成功读取 ${questionBank.length} 道题`);

// 改进的分类函数
function looksLikeReading(text) {
  if (!text) return false;
  // 长度很长
  if (text.length > 400) return true;
  // 有"阅读"且有多个子题
  if (text.includes('阅读') && (text.includes('题1') || text.includes('（1）') || text.includes('1.'))) return true;
  // 有多个子题编号
  const subQ = (text.match(/题\d/g) || []).length + (text.match(/（\d）/g) || []).length;
  if (subQ >= 2 && text.length > 200) return true;
  // 有多个完整句子（可能是短文）
  const sentences = text.match(/[^。！？!?]*[。！？!?]/g) || [];
  if (sentences.length >= 4 && text.length > 200) return true;
  return false;
}

function classify(text) {
  if (!text) return 'word';
  const t = text.toLowerCase();
  
  // 写作
  if (t.includes('写话') || t.includes('作文') || t.includes('写作') || 
      t.includes('看图写') || t.includes('习作')) return 'writing';
  
  // 阅读理解
  if (looksLikeReading(text)) return 'reading';
  
  // 拼音
  if (t.includes('拼音') || t.includes('声母') || t.includes('韵母') || 
      t.includes('音节') || t.includes('标拼音') || t.includes('读拼音') ||
      t.includes('整体认读') || t.includes('声调') || t.includes('拼读')) return 'pinyin';
  
  // 识字写字
  if (t.includes('笔画') || t.includes('笔顺') || t.includes('偏旁') ||
      t.includes('部首') || t.includes('错别字') || t.includes('加偏旁') ||
      t.includes('换偏旁') || t.includes('识字') || t.includes('写字')) return 'character';
  
  // 句子练习
  if (t.includes('连词成句') || t.includes('扩句') || t.includes('造句') ||
      t.includes('感叹句') || t.includes('标点') || t.includes('病句') ||
      t.includes('补全句子') || t.includes('改写句子') || t.includes('句子练习')) return 'sentence';
  
  // 词语理解
  if (t.includes('反义词') || t.includes('近义词') || t.includes('量词') ||
      t.includes('aabb') || t.includes('词语搭配') || t.includes('组词') ||
      t.includes('填词') || t.includes('成语')) return 'word';
  
  return 'word';
}

// 执行分类
const typeLabels = {
  pinyin: '拼音', character: '识字写字', word: '词语理解',
  sentence: '句子练习', reading: '阅读理解', writing: '写作练习'
};
const counts = { pinyin: 0, character: 0, word: 0, sentence: 0, reading: 0, writing: 0 };
let changed = 0;

questionBank.forEach(q => {
  const oldType = q.type;
  const newType = classify(q.question);
  q.newType = newType;
  if (oldType !== newType) changed++;
  counts[newType]++;
});

console.log(`分类完成，${changed} 道题类型变更`);
console.log('\n新分类统计：');
Object.entries(typeLabels).forEach(([k, v]) => {
  console.log(`  ${v}: ${counts[k]} 道`);
});

// 生成新的 questionBank.ts
function esc(s) {
  if (!s) return '';
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

let lines = [];
lines.push("export type Grade = 1 | 2 | 3 | 4 | 5 | 6;");
lines.push("export type SubjectType = 'pinyin' | 'character' | 'word' | 'sentence' | 'reading' | 'writing';");
lines.push("");
lines.push("export interface Question {");
lines.push("  id: string;");
lines.push("  grade: Grade;");
lines.push("  type: SubjectType;");
lines.push("  question: string;");
lines.push("  answer: string;");
lines.push("  explanation?: string;");
lines.push("  tags?: string[];");
lines.push("}");
lines.push("");
lines.push("export const subjectTypeLabels: Record<SubjectType, string> = {");
lines.push("  pinyin:   '拼音',");
lines.push("  character: '识字写字',");
lines.push("  word:      '词语理解',");
lines.push("  sentence:  '句子练习',");
lines.push("  reading:   '阅读理解',");
lines.push("  writing:   '写作练习',");
lines.push("};");
lines.push("");
lines.push("// 按年级+题型筛选");
lines.push("export function getQuestionsByGradeAndType(grade: Grade, type: SubjectType): Question[] {");
lines.push("  return questionBank.filter(q => q.grade === grade && q.type === type);");
lines.push("}");
lines.push("");
lines.push("// 搜索题库（全年级模糊匹配）");
lines.push("export function findBestMatch(input: string): Question | null {");
lines.push("  const keywords = input.replace(/[？?。.,，、；;：:！!（）()]/g, ' ').split(/\\s+/).filter(Boolean);");
lines.push("  let best: Question | null = null;");
lines.push("  let bestScore = 0;");
lines.push("  for (const q of questionBank) {");
lines.push("    const target = q.question + ' ' + q.answer;");
lines.push("    let score = 0;");
lines.push("    for (const kw of keywords) {");
lines.push("      if (target.includes(kw)) score += 2;");
lines.push("      else if (target.toLowerCase().includes(kw.toLowerCase())) score += 1;");
lines.push("    }");
lines.push("    if (score > bestScore) { bestScore = score; best = q; }");
lines.push("  }");
lines.push("  return bestScore >= 2 ? best : null;");
lines.push("}");
lines.push("");
lines.push("// 年级颜色配置（用于 UI 显示）");
lines.push("export const gradeColors: Record<Grade, { bg: string; text: string; border: string; badge: string }> = {");
lines.push("  1: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },");
lines.push("  2: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },");
lines.push("  3: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },");
lines.push("  4: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', badge: 'bg-green-100 text-green-700' },");
lines.push("  5: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },");
lines.push("  6: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },");
lines.push("};");
lines.push("");
lines.push("// 获取某年级有哪些题型（去重）");
lines.push("export function getAvailableTypes(grade: Grade): SubjectType[] {");
lines.push("  const types = new Set<SubjectType>();");
lines.push("  for (const q of questionBank) {");
lines.push("    if (q.grade === grade) types.add(q.type);");
lines.push("  }");
lines.push("  return Array.from(types);");
lines.push("}");
lines.push("");
lines.push("export const questionBank: Question[] = [");

questionBank.forEach(q => {
  lines.push("  {");
  lines.push(`    id: '${q.id}',`);
  lines.push(`    grade: ${q.grade},`);
  lines.push(`    type: '${q.newType}',`);
  lines.push(`    question: '${esc(q.question)}',`);
  lines.push(`    answer: '${esc(q.answer)}',`);
  if (q.explanation) lines.push(`    explanation: '${esc(q.explanation)}',`);
  if (q.tags && q.tags.length) lines.push(`    tags: [${q.tags.map(t => `'${t}'`).join(', ')}],`);
  lines.push("  },");
});

lines.push("];");
lines.push("");

fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
console.log(`\n✅ ${filePath} 已更新，共 ${questionBank.length} 道题`);
