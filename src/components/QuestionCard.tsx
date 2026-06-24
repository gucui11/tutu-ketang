import { useState, useMemo } from 'react';
import type { Question } from '../data/questionBank';
import { gradeColors, subjectTypeLabels } from '../data/questionBank';
import AnswerPanel from './AnswerPanel';

interface Props {
  question: Question;
  onBack: () => void;
  onNext: () => void;
}

const typeEmojis: Record<string, string> = {
  拼音: '🔤',
  识字写字: '✍️',
  词语理解: '📖',
  句子练习: '📝',
  阅读理解: '🔍',
  写作练习: '✒️',
  写作知识: '✒️',
  阅读专项: '🔍',
  古诗词专项选择题: '📜',
  字词专项选择题: '📖',
  句子专项选择题: '📝',
  诗词: '📜',
  字音辨析: '🔤',
  '字义、词语理解': '📖',
  字形辨析: '✍️',
  词语运用: '📖',
  课内外阅读书目常识: '📚',
  词语练习: '📖',
  诗词练习: '📜',
  填空题: '📝',
  判断题: '✅',
  选择题: '📋',
  默写题: '🖊️',
};

// 检测是否为判断题（答案只有 √ 或 ×）
function isTrueFalse(answer: string): boolean {
  const a = answer.trim();
  return a === '√' || a === '×' || a === '对' || a === '错';
}

// 解析选项：从题目文本中提取 A/B/C/D 选项
// 支持两种格式：
//   1. 每行一个选项：A. xxx\nB. xxx\nC. xxx\nD. xxx
//   2. 所有选项挤在一行：A. xxx    B. xxx    C. xxx    D. xxx
function parseOptions(text: string): string[] | null {
  const lines = text.split('\n');
  const opts: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    // 先试：该行包含多个选项（挤在一行的情况）
    if (/^[A-D][.．。、]/.test(trimmed) && /[A-D][.．。、]/.test(trimmed.replace(/^[A-D][.．。、]\s*[^A-D]*/, ''))) {
      const parts = trimmed.split(/(?=[A-D][.．。、])/);
      for (const part of parts) {
        const t = part.trim();
        if (/^[A-D][.．。、]/.test(t)) opts.push(t);
      }
    } else if (/^[A-D][.．。、\s]/.test(trimmed)) {
      // 每行一个选项
      opts.push(trimmed);
    }
  }
  return opts.length >= 2 ? opts : null;
}

// 解析多小题阅读理解（六年级）
interface SubQuestion {
  index: number;       // 题号（如 1, 2, 3）
  text: string;        // 题干文本（含选项）
  options: string[];   // 选项列表
  answerKey: string;   // 标准答案字母
}

function parseSubQuestions(text: string, answerStr: string): SubQuestion[] | null {
  // 尝试按数字题号分割
  const parts = text.split(/(?=\n\d+[.．。、]\s)/);
  if (parts.length < 2) return null;

  // 解析答案字符串，如 "1.B 2.B 3.D" 或 "6.C 7.B 8.C"
  const answerMap: Record<number, string> = {};
  const ansMatches = answerStr.matchAll(/(\d+)[.．]?\s*([A-Da-d])/g);
  for (const m of ansMatches) {
    answerMap[parseInt(m[1])] = m[2].toUpperCase();
  }

  const subQs: SubQuestion[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // 第一部分是短文本身（没有题号开头），跳过
    if (!/^\d+[.．。、]/.test(trimmed)) continue;

    const numMatch = trimmed.match(/^(\d+)/);
    if (!numMatch) continue;
    const idx = parseInt(numMatch[1]);
    const opts = parseOptions(trimmed) ?? [];

    subQs.push({
      index: idx,
      text: trimmed,
      options: opts,
      answerKey: answerMap[idx] ?? '',
    });
  }

  return subQs.length >= 2 ? subQs : null;
}

export default function QuestionCard({ question, onBack, onNext }: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [answerTrigger, setAnswerTrigger] = useState(0);

  // 单题选择
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  // 文本输入答案（填空/简答/默写/写作等非选择题）
  const [textAnswer, setTextAnswer] = useState('');

  // 六年级阅读理解多小题
  const [subAnswers, setSubAnswers] = useState<Record<number, string>>({});

  const colors = gradeColors[question.grade];

  // 是否是六年级阅读理解（多小题模式）
  const isGrade6Reading = question.grade === 6 && question.type === '阅读理解';

  // 解析多小题
  const subQuestions = useMemo(() => {
    if (!isGrade6Reading) return null;
    return parseSubQuestions(question.question, question.answer);
  }, [question.id]);

  // 普通选择题选项
  const singleOptions = useMemo(() => {
    if (isGrade6Reading) return null;
    return parseOptions(question.question);
  }, [question.id]);

  // 判断题
  const isTF = useMemo(() => {
    if (isGrade6Reading) return false;
    if (singleOptions) return false; // 有ABCD选项就不是判断题
    return isTrueFalse(question.answer);
  }, [question.id, singleOptions]);

  // 能否提交
  const canSubmit = useMemo(() => {
    if (showAnswer) return false;
    if (subQuestions) {
      // 多小题：所有小题都要选
      return subQuestions.every(sq => subAnswers[sq.index] !== undefined);
    }
    if (singleOptions) {
      // 单选题：选了一个
      return selectedOption !== null;
    }
    if (isTF) {
      // 判断题：选了 对 或 错
      return selectedOption !== null;
    }
    // 非选择题（填空/简答/默写/写作）：需要输入文字
    return textAnswer.trim().length > 0;
  }, [showAnswer, subQuestions, subAnswers, singleOptions, isTF, selectedOption, textAnswer]);

  const handleSubmit = () => {
    setShowAnswer(true);
    setAnswerTrigger(t => t + 1);
  };

  const handleNext = () => {
    setShowAnswer(false);
    setAnswerTrigger(0);
    setSelectedOption(null);
    setTextAnswer('');
    setSubAnswers({});
    onNext();
  };

  const handleBack = () => {
    setShowAnswer(false);
    setSelectedOption(null);
    setTextAnswer('');
    setSubAnswers({});
    onBack();
  };

  // 提取阅读理解中的短文（多小题前的文段）
  const passageText = useMemo(() => {
    if (!subQuestions) return null;
    const firstQNum = subQuestions[0]?.index;
    const idx = question.question.search(new RegExp(`\n${firstQNum}[.．。、]`));
    if (idx > 0) return question.question.substring(0, idx).trim();
    return null;
  }, [question.id, subQuestions]);

  return (
    <div className="space-y-4">
      {/* 返回导航 */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <span>←</span> 返回选题
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <span className={`grade-badge ${colors.badge} text-xs px-3`}>
            {question.grade}年级
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full flex items-center gap-1">
            {typeEmojis[question.type] ?? '📋'}{subjectTypeLabels[question.type as keyof typeof subjectTypeLabels] ?? question.type}
          </span>
        </div>
      </div>

      {/* ===== 六年级阅读理解：多小题模式 ===== */}
      {isGrade6Reading && subQuestions ? (
        <>
          {/* 阅读短文 */}
          {passageText && (
            <div className={`card border-2 ${colors.border} ${colors.bg}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${colors.badge}`}>
                  📖
                </div>
                <span className={`text-sm font-bold ${colors.text}`}>阅读短文</span>
              </div>
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                {passageText}
              </p>
            </div>
          )}

          {/* 每道小题 */}
          {subQuestions.map((sq) => (
            <SubQuestionCard
              key={sq.index}
              sq={sq}
              selected={subAnswers[sq.index] ?? null}
              showAnswer={showAnswer}
              colors={colors}
              onSelect={(opt) => setSubAnswers(prev => ({ ...prev, [sq.index]: opt }))}
            />
          ))}

          {/* 提交按钮 */}
          {!showAnswer ? (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md
                ${canSubmit
                  ? 'bg-amber-500 hover:bg-amber-600 text-white hover:shadow-lg active:scale-95'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
              {canSubmit ? (
                <><span>📤</span> 提交答案</>
              ) : (
                <><span>⏳</span> 请完成所有小题再提交</>
              )}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleNext}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 text-sm flex items-center justify-center gap-2"
              >
                <span>→</span> 下一题
              </button>
              <button
                onClick={() => { setShowAnswer(false); }}
                className="btn-outline text-sm"
              >
                收起答案
              </button>
            </div>
          )}

          {/* 整体答案展示 */}
          {showAnswer && (
            <div className="animate-slide-up">
              <AnswerPanel
                answer={question.answer}
                explanation={question.explanation}
                trigger={answerTrigger}
              />
            </div>
          )}
        </>
      ) : (
        /* ===== 普通题目模式 ===== */
        <>
          <div className={`card border-2 ${colors.border} ${colors.bg}`}>
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${colors.badge}`}>
                {typeEmojis[question.type]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold ${colors.text}`}>题目</span>
                  {question.tags?.map(tag => (
                    <span key={tag} className="text-xs bg-white/70 text-gray-500 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                {/* 题干（去掉选项行，单独渲染选项按钮） */}
                <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap font-medium">
                  {singleOptions
                    ? question.question.split('\n').filter(l => !/^[A-D][.．。、\s]/.test(l.trim())).join('\n').trim()
                    : question.question
                  }
                </p>
              </div>
            </div>

            {/* 单选题选项按钮 */}
            {singleOptions && !isTF && (
              <div className="mt-3 space-y-2">
                {singleOptions.map((opt) => {
                  const letter = opt[0];
                  const isSelected = selectedOption === letter;
                  const isCorrect = showAnswer && question.answer.toUpperCase().startsWith(letter);
                  const isWrong = showAnswer && isSelected && !isCorrect;
                  return (
                    <button
                      key={letter}
                      onClick={() => !showAnswer && setSelectedOption(letter)}
                      disabled={showAnswer}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all duration-200
                        ${showAnswer
                          ? isCorrect
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                            : isWrong
                              ? 'border-red-300 bg-red-50 text-red-700'
                              : 'border-gray-200 bg-white text-gray-500'
                          : isSelected
                            ? `border-amber-400 ${colors.bg} ${colors.text} font-medium`
                            : 'border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50'
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        {showAnswer && isCorrect && <span>✅</span>}
                        {showAnswer && isWrong && <span>❌</span>}
                        {!showAnswer && isSelected && <span className={`w-2 h-2 rounded-full ${colors.text.replace('text-', 'bg-')} inline-block`} />}
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 判断题 对/错 按钮 */}
            {isTF && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {['对', '错'].map((choice) => {
                  const isCorrectAnswer = question.answer.includes('对');
                  const thisIsCorrect = choice === '对';
                  const isSelected = selectedOption === choice;
                  const isCorrect = showAnswer && thisIsCorrect === isCorrectAnswer;
                  const isWrong = showAnswer && isSelected && !isCorrect;
                  return (
                    <button
                      key={choice}
                      onClick={() => !showAnswer && setSelectedOption(choice)}
                      disabled={showAnswer}
                      className={`py-3 rounded-xl border-2 text-base font-semibold transition-all duration-200 flex items-center justify-center gap-2
                        ${showAnswer
                          ? isCorrect
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                            : isWrong
                              ? 'border-red-300 bg-red-50 text-red-700'
                              : 'border-gray-200 bg-white text-gray-500'
                          : isSelected
                            ? `border-amber-400 ${colors.bg} ${colors.text}`
                            : 'border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50'
                        }`}
                    >
                      {showAnswer && isCorrect && <span>✅</span>}
                      {showAnswer && isWrong && <span>❌</span>}
                      {choice === '对' ? '✅ 正确' : '❌ 错误'}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 文本输入题（填空/简答/默写/写作）：学生输入区域 */}
            {!singleOptions && !isTF && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500">✏️</span>
                  <span className="text-xs text-gray-500">请在下方输入你的答案</span>
                </div>
                {!showAnswer ? (
                  <textarea
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="在这里写下你的答案…"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm text-gray-800 placeholder-gray-400 
                      focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 
                      resize-y transition-all duration-200 bg-white"
                  />
                ) : (
                  <div className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs">✏️</span>
                      <span className="text-xs font-semibold text-emerald-700">你的作答</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{textAnswer}</p>
                  </div>
                )}
              </div>
            )}

            {/* 操作按钮区 */}
            <div className="mt-4">
              {!showAnswer ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2
                      ${canSubmit
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg active:scale-95'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {isTF && !selectedOption
                      ? <><span>⏳</span> 请选择对或错</>
                      : singleOptions && !selectedOption
                        ? <><span>⏳</span> 请先选择答案</>
                      : !singleOptions && !isTF && !textAnswer.trim()
                        ? <><span>⏳</span> 请输入你的答案</>
                        : <><span>📤</span> 提交答案</>
                    }
                  </button>
                  <button
                    onClick={handleNext}
                    className="btn-outline flex items-center gap-1.5 text-sm"
                  >
                    换一题 →
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleNext}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 text-sm flex items-center justify-center gap-2"
                  >
                    <span>→</span> 下一题
                  </button>
                  <button
                    onClick={() => { setShowAnswer(false); setSelectedOption(null); setTextAnswer(''); }}
                    className="btn-outline text-sm"
                  >
                    收起答案
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 答案区域 */}
          {showAnswer && (
            <div className="animate-slide-up">
              <AnswerPanel
                answer={question.answer}
                explanation={question.explanation}
                trigger={answerTrigger}
              />
            </div>
          )}
        </>
      )}

      {/* 批改提示 */}
      <div className="card bg-amber-50 border-amber-100">
        <div className="flex items-start gap-3">
          <span className="text-xl">👩‍🏫</span>
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">老师批改提示</p>
            <p className="text-amber-700 text-xs leading-relaxed">
              参考答案仅供参考，学生若有其他合理表述，请根据实际情况酌情给分。
              鼓励创意作答，尤其是写作类题目。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 单个小题卡片（六年级阅读理解用） */
function SubQuestionCard({
  sq,
  selected,
  showAnswer,
  colors,
  onSelect,
}: {
  sq: SubQuestion;
  selected: string | null;
  showAnswer: boolean;
  colors: { bg: string; text: string; border: string; badge: string };
  onSelect: (opt: string) => void;
}) {
  // 题干（去掉选项行）
  const stem = sq.text.split('\n').filter(l => !/^[A-D][.．。、\s]/.test(l.trim())).join('\n').trim();

  return (
    <div className={`card border-2 ${showAnswer ? (selected === sq.answerKey ? 'border-emerald-300' : 'border-red-200') : 'border-gray-200'} bg-white`}>
      <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap mb-3 font-medium">
        {stem}
      </p>
      <div className="space-y-2">
        {sq.options.map((opt) => {
          const letter = opt[0];
          const isSelected = selected === letter;
          const isCorrect = showAnswer && letter === sq.answerKey;
          const isWrong = showAnswer && isSelected && !isCorrect;
          return (
            <button
              key={letter}
              onClick={() => !showAnswer && onSelect(letter)}
              disabled={showAnswer}
              className={`w-full text-left px-4 py-2 rounded-xl border-2 text-sm transition-all duration-200
                ${showAnswer
                  ? isCorrect
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                    : isWrong
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-gray-100 bg-gray-50 text-gray-400'
                  : isSelected
                    ? `border-amber-400 ${colors.bg} ${colors.text} font-medium`
                    : 'border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50'
                }`}
            >
              <span className="flex items-center gap-2">
                {showAnswer && isCorrect && <span>✅</span>}
                {showAnswer && isWrong && <span>❌</span>}
                {opt}
              </span>
            </button>
          );
        })}
      </div>
      {/* 选中状态提示 */}
      {!showAnswer && selected && (
        <p className={`text-xs mt-2 ${colors.text}`}>已选择：{selected}</p>
      )}
    </div>
  );
}
