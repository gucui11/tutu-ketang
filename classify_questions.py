#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智能题库分类脚本
读取现有 questionBank.ts，根据题目内容自动分类题型，并补全答案
"""

import re
import json

# 读取 questionBank.ts
with open('src/data/questionBank.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 用正则提取每道题
# 匹配每个 { ... } 题目对象
question_pattern = re.compile(
    r'\{\s*'
    r'id:\s*\'(?P<id>[^\']+)\'\s*,\s*'
    r'grade:\s*(?P<grade>\d+)\s*,\s*'
    r'type:\s*\'(?P<type>[^\']+)\'\s*,\s*'
    r'question:\s*\'(?P<question>(?:[^\'\\]|\\.|\\\')*)\'\s*,\s*'
    r'answer:\s*\'(?P<answer>(?:[^\'\\]|\\.|\\\')*)\'\s*'
    r'(?:,\s*explanation:\s*\'(?P<explanation>(?:[^\'\\]|\\.|\\\')*)\'\s*)?'
    r'(?:,\s*tags:\s*\[(?P<tags>[^\]]*)\]\s*)?'
    r'\}',
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
        'tags': m.group('tags') or '',
    }
    questions.append(q)

print(f'提取到 {len(questions)} 道题')

# 分类规则（按优先级排序）
def classify_question(q_text):
    """根据题目内容判断题型"""
    text = q_text.lower()
    
    # 写作练习 - 最高优先级（特征明显）
    if any(kw in text for kw in ['写话', '作文', '写作', '看图写', '习作', '我的写话', '写一写']):
        return 'writing'
    
    # 阅读理解 - 有短文和阅读习题特征
    if any(kw in text for kw in ['阅读短文', '阅读习题', '自然段', '文中提到', '这篇短文', '阅读文章', '阅读理解', '☐', '阅读']) and len(text) > 100:
        return 'reading'
    
    # 拼音
    if any(kw in text for kw in ['拼音', '声母', '韵母', '音节', '标拼音', '读拼音', '整体认读', '声调', '拼读', '汉语拼音', 'pīn', 'yīn']):
        return 'pinyin'
    
    # 识字写字
    if any(kw in text for kw in ['笔画', '笔顺', '偏旁', '部首', '错别字', '汉字', '加偏旁', '换偏旁', '识字', '写字', '看图写字', '按笔顺']):
        return 'character'
    
    # 词语理解
    if any(kw in text for kw in ['词语', '反义词', '近义词', '量词', 'aabb', '搭配', '组词', '填词', '选词', '成语', '词语搭配']):
        return 'word'
    
    # 句子练习
    if any(kw in text for kw in ['句子', '造句', '连词成句', '扩句', '感叹句', '标点', '修辞', '病句', '改写句子', '补全句子', '句子练习']):
        return 'sentence'
    
    # 默认：根据年级和题目长度判断
    if len(text) > 150:
        return 'reading'
    return 'word'  # 最保守的默认

# 对每道题重新分类
type_counts = {'pinyin': 0, 'character': 0, 'word': 0, 'sentence': 0, 'reading': 0, 'writing': 0}
fixed_questions = []

for q in questions:
    new_type = classify_question(q['question'])
    q['new_type'] = new_type
    type_counts[new_type] += 1
    fixed_questions.append(q)

print('\n重新分类结果：')
for t, label in [('pinyin', '拼音'), ('character', '识字写字'), ('word', '词语理解'), ('sentence', '句子练习'), ('reading', '阅读理解'), ('writing', '写作练习')]:
    print(f'  {label}: {type_counts[t]} 道')

# 输出为 JSON 供检查
with open('fixed_questions.json', 'w', encoding='utf-8') as f:
    json.dump(fixed_questions, f, ensure_ascii=False, indent=2)

print('\n已保存到 fixed_questions.json')
print('\n样本检查（前10道）：')
for q in fixed_questions[:10]:
    print(f"  {q['id']} | 原类型={q['type']} | 新类型={q['new_type']} | {q['question'][:50].replace(chr(10), ' ')}...")
