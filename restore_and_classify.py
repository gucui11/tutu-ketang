#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 questionBank_generated.ts 恢复题目数据，
重新分类题型，生成正确的 questionBank.ts
"""

import json
import re

# 读取备份文件
with open('questionBank_generated.ts', 'r', encoding='utf-8') as f:
    content = f.read()

print(f'读取备份文件，长度 {len(content)} 字符')

# 用正则提取每道题
# 格式: { id: "g1-q-001", grade: 1, type: "reading", typeLabel: "...", question: "...", answer: "...", tags: [...], },
# 注意：字符串用双引号，且有转义

questions = []
# 用更简单的办法：按 id: "..." 分割
blocks = re.split(r'(?=\s*{\s*id:\s*)', content)

for block in blocks:
    if not block.strip() or 'id:' not in block:
        continue
    
    q = {}
    
    # 提取 id
    m = re.search(r'id:\s*"([^"]+)"', block)
    if m: q['id'] = m.group(1)
    else: continue
    
    # 提取 grade
    m = re.search(r'grade:\s*(\d+)', block)
    if m: q['grade'] = int(m.group(1))
    
    # 提取 type
    m = re.search(r'type:\s*"([^"]+)"', block)
    if m: q['old_type'] = m.group(1)
    
    # 提取 question（可能多行）
    m = re.search(r'question:\s*"((?:[^"\\]|\\.|\\\n)*)"', block, re.DOTALL)
    if m:
        q['question'] = m.group(1).replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
    
    # 提取 answer
    m = re.search(r'answer:\s*"((?:[^"\\]|\\.|\\\n)*)"', block, re.DOTALL)
    if m:
        q['answer'] = m.group(1).replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
    
    # 提取 explanation
    m = re.search(r'explanation:\s*"((?:[^"\\]|\\.|\\\n)*)"', block, re.DOTALL)
    if m:
        exp = m.group(1).replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
        if exp and exp not in q.get('question', ''):
            q['explanation'] = exp
    
    # 提取 tags
    m = re.search(r'tags:\s*\[([^\]]*)\]', block)
    if m:
        q['tags'] = m.group(1).strip()
    
    if q.get('id'):
        questions.append(q)

print(f'提取到 {len(questions)} 道题')

if len(questions) == 0:
    print('提取失败！')
    exit(1)

# 分类函数（更精准）
def classify(text):
    if not text:
        return 'word'
    t = text.lower()
    
    # 写作
    if '写话' in t or '作文' in t or '写作' in t or '看图写' in t or '习作' in t:
        return 'writing'
    
    # 阅读理解
    if (t.count('。') > 3 and ('阅读' in t or '短文' in t)) or \
       '阅读习题' in t or '自然段' in t or '这篇短文' in t or \
       (t.startswith('题1') and len(t) > 200 and '（' in t):
        return 'reading'
    if '阅读' in t and ('题' in t) and len(t) > 100:
        return 'reading'
    
    # 拼音
    if '拼音' in t or '声母' in t or '韵母' in t or '音节' in t or \
       '标拼音' in t or '读拼音' in t or '整体认读' in t or \
       '声调' in t or '拼读' in t:
        return 'pinyin'
    
    # 识字写字
    if '笔画' in t or '笔顺' in t or '偏旁' in t or '部首' in t or \
       '错别字' in t or '加偏旁' in t or '换偏旁' in t or \
       '识字' in t or '写字' in t:
        return 'character'
    
    # 词语理解
    if '反义词' in t or '近义词' in t or '量词' in t or 'aabb' in t or \
       '词语搭配' in t or '组词' in t or '填词' in t or '成语' in t or \
       (t.startswith('题') and ('词语' in t)):
        return 'word'
    
    # 句子练习
    if '连词成句' in t or '扩句' in t or '造句' in t or '感叹句' in t or \
       '标点' in t or '病句' in t or '补全句子' in t or '改写句子' in t or \
       '句子练习' in t:
        return 'sentence'
    
    # 按长度判断
    if len(text) > 250:
        return 'reading'
    
    # 默认
    return 'word'

# 执行分类
type_labels = {
    'pinyin': '拼音',
    'character': '识字写字',
    'word': '词语理解',
    'sentence': '句子练习',
    'reading': '阅读理解',
    'writing': '写作练习'
}

counts = {k: 0 for k in type_labels}
changed = 0

for q in questions:
    new_type = classify(q.get('question', ''))
    q['new_type'] = new_type
    if q.get('old_type') != new_type:
        changed += 1
    counts[new_type] += 1

print(f'分类完成，{changed} 道题类型有变化')
print('\n分类统计：')
for k in ['pinyin', 'character', 'word', 'sentence', 'reading', 'writing']:
    print(f'  {type_labels[k]}: {counts[k]} 道')

# 生成新的 questionBank.ts
def esc(s):
    """转义 TypeScript 字符串"""
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
    lines.append(f"    question: '{esc(q.get('question', ''))}',")
    lines.append(f"    answer: '{esc(q.get('answer', ''))}',")
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

print(f'\n新的 questionBank.ts 已生成！')
print(f'  文件路径: src/data/questionBank.ts')
print(f'  文件大小: {len(output)} 字符')
print(f'  题目数量: {len(questions)} 道')
