#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成新的 questionBank.ts
- 修复题型分类
- 保留原有答案
- 输出标准的 TypeScript 格式
"""

import json
import re

with open('fixed_questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

print(f'读到 {len(questions)} 道题，开始生成 questionBank.ts...')

# 更精准的分类函数
def classify(text):
    if not text:
        return 'word'
    t = text.lower()
    
    # 1. 写作 - 最明确
    if '写话' in t or '作文' in t or '写作' in t or '看图写' in t or '习作' in t:
        return 'writing'
    
    # 2. 阅读理解 - 有短文+习题特征
    #    判断特征：有"阅读"字样且有多个问号/习题编号
    if '阅读' in t and ('题' in t or '（' in t) and len(t) > 100:
        return 'reading'
    if '阅读短文' in t or '阅读习题' in t or '自然段' in t:
        return 'reading'
    
    # 3. 拼音 - 明确关键词
    if (('拼音' in t or '声母' in t or '韵母' in t or '音节' in t) or
        ('标音' in t) or ('声调' in t and '标' in t) or
        ('拼读' in t) or ('整体认读' in t)):
        return 'pinyin'
    
    # 4. 识字写字 - 明确关键词
    if (('笔画' in t and '数' in t) or '笔顺' in t or 
        '偏旁' in t or '部首' in t or '错别字' in t or
        ('加偏旁' in t) or ('换偏旁' in t) or
        (t.startswith('题') and ('汉字' in t or '识字' in t))):
        return 'character'
    
    # 5. 句子练习 - 明确关键词
    if ('连词成句' in t or '扩句' in t or '造句' in t or
        '感叹句' in t or '标点' in t or '病句' in t or
        '补全句子' in t or '改写句子' in t or
        ('句子' in t and ('练习' in t or '下列' in t))):
        return 'sentence'
    
    # 6. 词语理解
    if ('反义词' in t or '近义词' in t or '量词' in t or
        'aabb' in t or '词语搭配' in t or '组词' in t or
        ('词语' in t and '下列' in t)):
        return 'word'
    
    # 根据长度判断：长题目更可能是阅读理解
    if len(text) > 300:
        return 'reading'
    if len(text) > 150 and ('（' in text and '）' in text):
        return 'reading'
    
    # 默认
    return 'word'

# 对每道题重新分类，并记录变化
changes = 0
for q in questions:
    old_type = q.get('type', '')
    new_type = classify(q.get('question', ''))
    q['final_type'] = new_type
    if old_type != new_type:
        changes += 1

print(f'分类完成，{changes} 道题的类型有变化')

# 统计新分类
from collections import Counter
type_counts = Counter(q['final_type'] for q in questions)
type_labels = {
    'pinyin': '拼音',
    'character': '识字写字',
    'word': '词语理解',
    'sentence': '句子练习',
    'reading': '阅读理解',
    'writing': '写作练习'
}
print('\n新分类统计：')
for k in ['pinyin', 'character', 'word', 'sentence', 'reading', 'writing']:
    print(f'  {type_labels[k]}: {type_counts.get(k, 0)} 道')

# 生成 TypeScript 文件
ts_lines = []
ts_lines.append('export type Grade = 1 | 2 | 3 | 4 | 5 | 6;')
ts_lines.append("export type SubjectType = 'pinyin' | 'character' | 'word' | 'sentence' | 'reading' | 'writing';")
ts_lines.append('')
ts_lines.append('export interface Question {')
ts_lines.append('  id: string;')
ts_lines.append('  grade: Grade;')
ts_lines.append("  type: SubjectType;")
ts_lines.append('  question: string;')
ts_lines.append('  answer: string;')
ts_lines.append('  explanation?: string;')
ts_lines.append('  tags?: string[];')
ts_lines.append('}')
ts_lines.append('')
ts_lines.append("export const subjectTypeLabels: Record<SubjectType, string> = {")
ts_lines.append("  pinyin:   '拼音',")
ts_lines.append("  character: '识字写字',")
ts_lines.append("  word:      '词语理解',")
ts_lines.append("  sentence:  '句子练习',")
ts_lines.append("  reading:   '阅读理解',")
ts_lines.append("  writing:   '写作练习',")
ts_lines.append('};')
ts_lines.append('')

# 辅助函数
ts_lines.append('// 按年级+题型筛选')
ts_lines.append('export function getQuestionsByGradeAndType(grade: Grade, type: SubjectType): Question[] {')
ts_lines.append('  return questionBank.filter(q => q.grade === grade && q.type === type);')
ts_lines.append('}')
ts_lines.append('')

# 搜索函数
ts_lines.append('// 搜索题库（全年级模糊匹配）')
ts_lines.append('export function findBestMatch(input: string): Question | null {')
ts_lines.append("  const keywords = input.replace(/[？?。.,，、；;：:！!（）()]/g, ' ').split(/\\s+/).filter(Boolean);")
ts_lines.append('  let best: Question | null = null;')
ts_lines.append('  let bestScore = 0;')
ts_lines.append('  for (const q of questionBank) {')
ts_lines.append('    const target = q.question + \" \" + q.answer;')
ts_lines.append('    let score = 0;')
ts_lines.append('    for (const kw of keywords) {')
ts_lines.append('      if (target.includes(kw)) score += 2;')
ts_lines.append('      else if (target.toLowerCase().includes(kw.toLowerCase())) score += 1;')
ts_lines.append('    }')
ts_lines.append('    if (score > bestScore) { bestScore = score; best = q; }')
ts_lines.append('  }')
ts_lines.append('  return bestScore >= 2 ? best : null;')
ts_lines.append('}')
ts_lines.append('')

# gradeColors
ts_lines.append('// 年级颜色配置（用于 UI 显示）')
ts_lines.append("export const gradeColors: Record<Grade, { bg: string; text: string; border: string; badge: string }> = {")
ts_lines.append("  1: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },  2: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },")
ts_lines.append("  3: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },")
ts_lines.append("  4: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', badge: 'bg-green-100 text-green-700' },")
ts_lines.append("  5: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },")
ts_lines.append("  6: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },")
ts_lines.append('};')
ts_lines.append('')

# getAvailableTypes
ts_lines.append('// 获取某年级有哪些题型（去重）')
ts_lines.append('export function getAvailableTypes(grade: Grade): SubjectType[] {')
ts_lines.append('  const types = new Set<SubjectType>();')
ts_lines.append('  for (const q of questionBank) {')
ts_lines.append('    if (q.grade === grade) types.add(q.type);')
ts_lines.append('  }')
ts_lines.append('  return Array.from(types);')
ts_lines.append('}')
ts_lines.append('')

# 题库数组
ts_lines.append('export const questionBank: Question[] = [')

def escape_js_string(s):
    """转义 JavaScript 字符串中的特殊字符"""
    if not s:
        return ''
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n').replace('\r', '\\r')

for q in questions:
    ts_lines.append('  {')
    ts_lines.append(f"    id: '{q['id']}',")
    ts_lines.append(f"    grade: {q['grade']},")
    ts_lines.append(f"    type: '{q['final_type']}',")
    ts_lines.append(f"    question: '{escape_js_string(q.get('question', ''))}',")
    ts_lines.append(f"    answer: '{escape_js_string(q.get('answer', ''))}',")
    
    explanation = q.get('explanation', '')
    if explanation and explanation not in ['', q.get('question', '')]:
        ts_lines.append(f"    explanation: '{escape_js_string(explanation)}',")
    
    tags = q.get('tags', '')
    if tags:
        ts_lines.append(f"    tags: [{tags}],")
    
    ts_lines.append('  },')

ts_lines.append('];')
ts_lines.append('')

output = '\n'.join(ts_lines)
with open('src/data/questionBank.ts', 'w', encoding='utf-8') as f:
    f.write(output)

print(f'\n✅ 新的 questionBank.ts 已生成！')
print(f'   文件大小: {len(output)} 字符')
print(f'   题目数量: {len(questions)} 道')
