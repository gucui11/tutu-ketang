/**
 * 解析 questionBank.ts 并重新分类题型
 * 用法: node fix_types.cjs
 */

const fs = require('fs');
const path = require('path');

// 读取文件
const filePath = path.join(__dirname, 'src', 'data', 'questionBank.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 去掉 type annotations 和 export，变成纯 JS
// 1. 去掉 export type/interface/function 等声明，只保留 questionBank 数组
const exportMatch = content.match(/export const questionBank: Question\[\] = (\[[\s\S]*\]);/);

if (!exportMatch) {
  console.error('找不到 questionBank 数组，尝试另一种方式...');
  // 另一种方式：直接eval
  // 先把内容转成有效的 JS
  let jsContent = content
    .replace(/export type.*?;/g, '')
    .replace(/export interface.*?{[\s\S]*?^}/gm, '')
    .replace(/export const.*?=.*?=>.*?;/g, '')
    .replace(/export function.*?{[\s\S]*?^}/gm, '')
    .replace(/SubjectType/g, 'string')
    .replace(/Grade/g, 'number');
  
  console.log('尝试 eval...');
  // 不太可靠，换种方式
  process.exit(1);
}

// 直接用 Function 来解析数组
// 构造一个安全的 JS 片段
let jsSnippet = content
  // 去掉所有 export
  .replace(/^export /gm, '')
  // 去掉类型注解
  .replace(/: Question\[\]/g, '')
  .replace(/: Question/g, '')
  .replace(/: Grade/g, '')
  .replace(/: SubjectType/g, '')
  .replace(/: Record<[^>]+>/g, '')
  .replace(/: string/g, '')
  .replace(/: number/g, '')
  // 去掉 interface 和 type 定义
  .replace(/^type Grade.*?;/gm, '')
  .replace(/^type SubjectType.*?;/gm, '')
  .replace(/^interface Question \{[\s\S]*?^\}/gm, '');

// 更简单的方式：直接提取数组部分并用 eval
// 找到数组开始位置
const arrayStart = content.indexOf('export const questionBank: Question[] = [');
let arrStr = '';
if (arrayStart !== -1) {
  // 从数组开始提取到文件末尾，然后找到匹配的右括号
  const start = arrayStart + 'export const questionBank: Question[] = '.length;
  let bracketCount = 0;
  let foundStart = false;
  let i = start;
  
  for (; i < content.length; i++) {
    if (content[i] === '[') {
      if (!foundStart) foundStart = true;
      bracketCount++;
    } else if (content[i] === ']') {
      bracketCount--;
      if (foundStart && bracketCount === 0) {
        arrStr = content.substring(start, i + 1);
        break;
      }
    }
  }
}

if (!arrStr) {
  console.error('无法提取数组');
  process.exit(1);
}

// 去掉类型注解，使其成为有效 JS
arrStr = arrStr
  .replace(/: Grade/g, '')
  .replace(/: SubjectType/g, '')
  .replace(/: Question/g, '')
  .replace(/SubjectType/g, '')
  .replace(/Grade/g, '');

// 安全包装后 eval
const questionBank = eval(arrStr);

console.log(`成功解析 ${questionBank.length} 道题`);

// 分类函数
function classify(text) {
  if (!text) return 'word';
  const t = text.toLowerCase();
  
  // 写作
  if (t.includes('写话') || t.includes('作文') || t.includes('写作') || 
      t.includes('看图写') || t.includes('习作')) {
    return 'writing';
  }
  
  // 阅读理解 - 需要有阅读短文特征
  if ((t.includes('阅读') && (t.includes('题') || t.includes('（'))) ||
      t.includes('阅读短文') || t.includes('阅读习题') || t.includes('自然段') ||
      t.includes('这篇短文') || t.includes('文中')) {
    return 'reading';
  }
  
  // 拼音
  if (t.includes('拼音') || t.includes('声母') || t.includes('韵母') || 
      t.includes('音节') || t.includes('标拼音') || t.includes('读拼音') ||
      t.includes('整体认读') || t.includes('声调') || t.includes('拼读')) {
    return 'pinyin';
  }
  
  // 识字写字
  if (t.includes('笔画') || t.includes('笔顺') || t.includes('偏旁') ||
      t.includes('部首') || t.includes('错别字') || t.includes('加偏旁') ||
      t.includes('换偏旁') || t.includes('识字') || t.includes('写字')) {
    return 'character';
  }
  
  // 词语理解
  if (t.includes('反义词') || t.includes('近义词') || t.includes('量词') ||
      t.includes('aabb') || t.includes('词语搭配') || t.includes('组词') ||
      t.includes('填词') || t.includes('成语') || t.includes('词语')) {
    return 'word';
  }
  
  // 句子练习
  if (t.includes('连词成句') || t.includes('扩句') || t.includes('造句') ||
      t.includes('感叹句') || t.includes('标点') || t.includes('病句') ||
      t.includes('补全句子') || t.includes('改写句子') || t.includes('句子练习')) {
    return 'sentence';
  }
  
  // 根据长度判断
  if (text.length > 300) return 'reading';
  return 'word';
}

// 执行分类
const typeLabels = {
  pinyin: '拼音',
  character: '识字写字',
  word: '词语理解',
  sentence: '句子练习',
  reading: '阅读理解',
  writing: '写作练习'
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

console.log(`分类完成，${changed} 道题类型有变化`);
console.log('\n新分类统计：');
Object.entries(typeLabels).forEach(([k, v]) => {
  console.log(`  ${v}: ${counts[k]} 道`);
});

// 样本检查 - 写入文件避免编码问题
const report = [];
report.push('=== 分类样本检查 ===\n');
Object.entries(typeLabels).forEach(([k, v]) => {
  const samples = questionBank.filter(q => q.newType === k).slice(0, 3);
  if (samples.length > 0) {
    report.push(`\n[${v}]\n`);
    samples.forEach(q => {
      const preview = q.question.replace(/\n/g, ' ').substring(0, 80);
      report.push(`  ${q.id} (原:${q.type}): ${preview}...\n`);
    });
  }
});

fs.writeFileSync('classification_report.txt', report.join(''), 'utf-8');
console.log('\n样本检查已保存到 classification_report.txt');

// 保存为 JSON
fs.writeFileSync('parsed_questions.json', JSON.stringify(questionBank, null, 2), 'utf-8');
console.log('已保存到 parsed_questions.json');

// 询问是否生成新的 questionBank.ts
console.log('\n请查看 classification_report.txt，如果分类正确，按任意键继续生成 questionBank.ts...');
