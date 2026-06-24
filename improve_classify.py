#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
改进分类：特别是把阅读理解题从词语理解中找出来
阅读理解题特征：
1. 题目文本很长（>300字）
2. 包含一篇短文（多个句子，有完整意思）
3. 短文后有多个小题（题1、题2 或 1. 2.）
"""

import re
import json

# 读取刚生成的 questionBank.ts
with open('src/data/questionBank.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 提取题目（用正则，格式是固定的）
question_pattern = re.compile(
    r"\{\s*"
    r"id:\s*'(?P<id>[^']+)'\s*,\s*"
    r"grade:\s*(?P<grade>\d+)\s*,\s*"
    r"type:\s*'(?P<type>[^']+)'\s*,\s*"
    r"question:\s*'(?P<question>(?:[^'\\]|\\.|\\\n)*)'\s*,\s*"
    r"answer:\s*'(?P<answer>(?:[^'\\]|\\.|\\\n)*)'\s*"
    r"(?:,\s*explanation:\s*'(?P<explanation>(?:[^'\\]|\\.|\\\n)*)'\s*)?"
    r"(?:,\s*tags:\s*\[(?P<tags>[^\]]*)\]\s*)?"
    r"\},?",
    re.DOTALL
)

questions = []
for m in question_pattern.finditer(content):
    q = {
        'id': m.group('id'),
        'grade': int(m.group('grade')),
        'type': m.group('type'),
        'question': m.group('question').replace('\\n', '\n').replace("\\'", "'"),
        'answer': m.group('answer').replace('\\n', '\n').replace("\\'", "'"),
        'explanation': m.group('explanation') or '',
        'tags': m.group('tags') or ''
    }
    questions.append(q)

print(f'提取到 {len(questions)} 道题')

# 改进的阅读理解检测
def looks_like_reading(q_text):
    """判断是否是阅读理解题"""
    text = q_text.strip()
    
    # 特征1：长度很长
    if len(text) > 400:
        return True
    
    # 特征2：包含"阅读"字样且有多个问题编号
    if '阅读' in text and ('题1' in text or '（1）' in text or '1.' in text):
        return True
    
    # 特征3：有多个"题X"或"（X）"格式的子题
    sub_questions = len(re.findall(r'题\d', text)) + len(re.findall(r'（\d）', text))
    if sub_questions >= 2 and len(text) > 200:
        return True
    
    # 特征4：有短文特征（多个完整句子，以句号/问号结束）
    sentences = re.findall(r'[^。！？!?]*[。！？!?]', text)
    if len(sentences) >= 4 and len(text) > 200:
        return True
    
    # 特征5：题目文本中包含"阅读"字样且后面跟着短文内容
    if '阅读' in text:
        idx = text.index('阅读')
        if idx < 50:  # "阅读"出现在前面
            return True
    
    return False

# 改进的分类函数
def classify_v2(text):
    if not text:
        return 'word'
    t = text.lower()
    
    # 1. 写作 - 最明确
    if '写话' in t or '作文' in t or '写作' in t or '看图写' in t or '习作' in t:
        return 'writing'
    
    # 2. 阅读理解 - 用改进的检测
    if looks_like_reading(text):
        return 'reading'
    
    # 3. 拼音
    if ('拼音' in t or '声母' in t or '韵母' in t or '音节' in t or
        '标拼音' in t or '读拼音' in t or '整体认读' in t or
        '声调' in t or '拼读' in t or '汉语拼音' in t):
        return 'pinyin'
    
    # 4. 识字写字
    if ('笔画' in t or '笔顺' in t or '偏旁' in t or '部首' in t or
        '错别字' in t or '加偏旁' in t or '换偏旁' in t or
        '识字' in t or '写字' in t or '按笔顺' in t):
        return 'character'
    
    # 5. 句子练习
    if ('连词成句' in t or '扩句' in t or '造句' in t or
        '感叹句' in t or '标点' in t or '病句' in t or
        '补全句子' in t or '改写句子' in t or '句子练习' in t or
        '连词' in t or '成句' in t):
        return 'sentence'
    
    # 6. 词语理解
    if ('反义词' in t or '近义词' in t or '量词' in t or
        'aabb' in t or '词语搭配' in t or '组词' in t or
        '填词' in t or '成语' in t or '词语' in t):
        return 'word'
    
    # 默认
    return 'word'

# 重新分类
type_labels = {
    'pinyin': '拼音',
    'character': '识字写字',
    'word': '词语理解',
    'sentence': '句子练习',
    'reading': '阅读理解',
    'writing': '写作练习'
}

counts = {k: 0 for k in type_labels}
for q in questions:
    new_type = classify_v2(q['question'])
    q['new_type'] = new_type
    counts[new_type] += 1

print('\n改进后分类统计：')
for k in ['pinyin', 'character', 'word', 'sentence', 'reading', 'writing']:
    print(f'  {type_labels[k]}: {counts[k]} 道')

# 特别检查：被分为"词语理解"的长题目
long_word = [q for q in questions if q['new_type'] == 'word' and len(q['question']) > 200]
print(f'\n"词语理解"中长度>200字的题目: {len(long_word)} 道')
for q in long_word[:3]:
    print(f"  {q['id']}: {q['question'][:100].replace(chr(10), ' ')}...")

# 生成新的 questionBank.ts
def esc(s):
    if not s:
        return ''
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')

lines = []
lines.append('export type Grade = 1 | 2 | 3 | 4 | 5 | 6;')
lines.append("export type SubjectType = 'pinyin' | 'character' | 'word' | 'sentence' | 'reading' | 'writing';")
lines.append('')
lines.append('export interface Question {')
lines.append('  id: string;')
lines.append('  grade: Grade;')
lines.append("  type: SubjectType;")
lines.append('  question: string;')
lines.append('  answer: string;')
lines.append('  explanation?: string;')
lines.append('  tags?: string[];')
lines.append('}')
lines.append('')
lines.append("export const subjectTypeLabels: Record<SubjectType, string> = {")
lines.append("  pinyin:   '拼音',")
lines.append("  character: '识字写字',")
lines.append("  word:      '词语理解',")
lines.append("  sentence:  '句子练习',")
lines.append("  reading:   '阅读理解',")
lines.append("  writing:   '写作练习',")
lines.append('};')
lines.append('')
lines.append('// 按年级+题型筛选')
lines.append('export function getQuestionsByGradeAndType(grade: Grade, type: SubjectType): Question[] {')
lines.append('  return questionBank.filter(q => q.grade === grade && q.type === type);')
lines.append('}')
lines.append('')
lines.append('// 搜索题库（全年级模糊匹配）')
lines.append('export function findBestMatch(input: string): Question | null {')
lines.append("  const keywords = input.replace(/[？?。.,，、；;：:！!（）()]/g, ' ').split(/\\s+/).filter(Boolean);")
lines.append('  let best: Question | null = null;')
lines.append('  let bestScore = 0;')
lines.append('  for (const q of questionBank) {')
lines.append('    const target = q.question + " " + q.answer;')
lines.append('    let score = 0;')
lines.append('    for (const kw of keywords) {')
lines.append('      if (target.includes(kw)) score += 2;')
lines.append('      else if (target.toLowerCase().includes(kw.toLowerCase())) score += 1;')
lines.append('    }')
lines.append('    if (score > bestScore) { bestScore = score; best = q; }')
lines.append('  }')
lines.append('  return bestScore >= 2 ? best : null;')
lines.append('}')
lines.append('')
lines.append('// 年级颜色配置（用于 UI 显示）')
lines.append("export const gradeColors: Record<Grade, { bg: string; text: string; border: string; badge: string }> = {")
lines.append("  1: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },")
lines.append("  2: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },")
lines.append("  3: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },")
lines.append("  4: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', badge: 'bg-green-100 text-green-700' },")
lines.append("  5: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },")
lines.append("  6: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },")
lines.append('};')
lines.append('')
lines.append('// 获取某年级有哪些题型（去重）')
lines.append('export function getAvailableTypes(grade: Grade): SubjectType[] {')
lines.append('  const types = new Set<SubjectType>();')
lines.append('  for (const q of questionBank) {')
lines.append('    if (q.grade === grade) types.add(q.type);')
lines.append('  }')
lines.append('  return Array.from(types);')
lines.append('}')
lines.append('')
lines.append('export const questionBank: Question[] = [')

for q in questions:
    lines.append('  {')
    lines.append(f"    id: '{q['id']}',")
    lines.append(f"    grade: {q['grade']},")
    lines.append(f"    type: '{q['new_type']}',")
    lines.append(f"    question: '{esc(q['question'])}',")
    lines.append(f"    answer: '{esc(q['answer'])}',")
    if q.get('explanation'):
        lines.append(f"    explanation: '{esc(q['explanation'])}',")
    if q.get('tags'):
        lines.append(f"    tags: [{q['tags']}],")
    lines.append('  },')

lines.append('];')
lines.append('')

output = '\n'.join(lines)
with open('src/data/questionBank.ts', 'w', encoding='utf-8') as f:
    f.write(output)

print(f'\n新的 questionBank.ts 已生成！共 {len(questions)} 道题')
