#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
直接读取 questionBank.ts 文本内容，用逐行解析方式提取题目，重新分类并生成新文件
"""

import re
import json

with open('src/data/questionBank.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 逐行解析，收集每个题目对象
questions = []
current_q = {}
in_question = False
current_field = None
current_value = ''

def finish_field(q, field, value):
    """保存当前字段值到题目对象"""
    v = value.strip().rstrip(',').strip()
    if field == 'id':
        # 去掉引号
        m = re.match(r"'(.*)'", v)
        if m: q['id'] = m.group(1)
    elif field == 'grade':
        q['grade'] = int(v)
    elif field == 'type':
        m = re.match(r"'(.*)'", v)
        if m: q['type'] = m.group(1)
    elif field == 'question':
        # 去掉首尾引号和转义
        if v.startswith("'") and v.endswith("'"):
            v = v[1:-1]
        q['question'] = v.replace('\\n', '\n').replace("\\'", "'")
    elif field == 'answer':
        if v.startswith("'") and v.endswith("'"):
            v = v[1:-1]
        q['answer'] = v.replace('\\n', '\n').replace("\\'", "'")
    elif field == 'explanation':
        if v.startswith("'") and v.endswith("'"):
            v = v[1:-1]
        q['explanation'] = v.replace('\\n', '\n').replace("\\'", "'")
    elif field == 'tags':
        q['tags'] = v
    return q

i = 0
while i < len(lines):
    line = lines[i]
    
    # 检测新题目对象开始
    if line.strip() == '{':
        current_q = {}
        in_question = True
        current_field = None
        current_value = ''
    elif line.strip() == '},' or line.strip() == '}':
        # 保存上一个字段
        if current_field and current_value:
            current_q = finish_field(current_q, current_field, current_value)
        # 保存题目
        if current_q.get('id'):
            questions.append(current_q.copy())
        current_q = {}
        in_question = False
        current_field = None
    elif in_question:
        # 解析字段
        stripped = line.strip()
        
        # 检查是否是新字段开始
        for field_name in ['id:', 'grade:', 'type:', 'question:', 'answer:', 'explanation:', 'tags:']:
            if stripped.startswith(field_name):
                # 保存上一个字段
                if current_field and current_value:
                    current_q = finish_field(current_q, current_field, current_value)
                
                current_field = field_name.rstrip(':')
                current_value = stripped[len(field_name):].strip()
                
                # 如果值在同一行结束（有引号配对）
                val = current_value
                if current_field in ['id', 'type']:
                    if val.endswith(',') or val.endswith("',"):
                        current_q = finish_field(current_q, current_field, val)
                        current_field = None
                        current_value = ''
                elif current_field in ['question', 'answer', 'explanation']:
                    # 多行字符串，需要继续读取
                    pass
                break
        else:
            # 继续当前字段的值
            if current_field and current_field in ['question', 'answer', 'explanation']:
                current_value += ' ' + stripped
            elif current_field and current_field == 'tags':
                current_value += stripped
                if ']' in stripped:
                    current_q = finish_field(current_q, current_field, current_value)
                    current_field = None
                    current_value = ''
    
    i += 1

print(f'提取到 {len(questions)} 道题')

if len(questions) == 0:
    print('未能提取到题目，请检查文件格式')
    # 打印前20行供调试
    for i, line in enumerate(lines[:20]):
        print(f'{i+1}: {line.rstrip()}')
    exit(1)

# 分类函数
def classify_question(q_text):
    if not q_text:
        return 'word'
    text = q_text.lower()
    
    # 写作
    if any(kw in text for kw in ['写话', '作文', '写作', '看图写', '习作', '我的写话']):
        return 'writing'
    
    # 阅读理解
    if any(kw in text for kw in ['阅读短文', '阅读习题', '自然段', '文中提到', '这篇短文', '阅读文章']) or \
       (text.count('。') > 3 and '阅读' in text):
        return 'reading'
    
    # 拼音
    if any(kw in text for kw in ['拼音', '声母', '韵母', '音节', '标拼音', '读拼音', '整体认读', '声调', '拼读']):
        return 'pinyin'
    
    # 识字写字
    if any(kw in text for kw in ['笔画', '笔顺', '偏旁', '部首', '错别字', '汉字', '加偏旁', '换偏旁', '识字', '写字']):
        return 'character'
    
    # 词语理解
    if any(kw in text for kw in ['词语', '反义词', '近义词', '量词', 'aabb', '词语搭配', '组词', '填词', '成语']):
        return 'word'
    
    # 句子练习
    if any(kw in text for kw in ['句子', '造句', '连词成句', '扩句', '感叹句', '标点', '修辞', '病句', '改写句子', '补全句子']):
        return 'sentence'
    
    # 根据长度判断
    if len(text) > 200:
        return 'reading'
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
    new_type = classify_question(q.get('question', ''))
    q['new_type'] = new_type
    counts[new_type] += 1

print('\n重新分类结果：')
for k, label in type_labels.items():
    print(f'  {label}: {counts[k]} 道')

# 样本检查
print('\n样本检查：')
for k, label in type_labels.items():
    sample = [q for q in questions if q.get('new_type') == k]
    if sample:
        print(f'\n[{label}] {sample[0]["id"]}: {sample[0].get("question", "")[:60].replace(chr(10), " ")}...')

# 保存
with open('fixed_questions.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print('\n已保存到 fixed_questions.json')
print('请检查分类结果，确认无误后告诉我，我来生成新的 questionBank.ts')
