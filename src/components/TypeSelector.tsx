import type { Grade } from '../data/questionBank';
import { subjectTypeLabels, getAvailableTypes, getQuestionsByGradeAndType } from '../data/questionBank';

interface Props {
  grade: Grade;
  selectedType: string | null;
  onSelect: (type: string) => void;
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

const typeColors: Record<string, string> = {
  拼音: 'from-pink-400 to-rose-500',
  识字写字: 'from-orange-400 to-amber-500',
  词语理解: 'from-yellow-400 to-orange-500',
  句子练习: 'from-emerald-400 to-teal-500',
  阅读理解: 'from-blue-400 to-indigo-500',
  写作练习: 'from-purple-400 to-violet-500',
  写作知识: 'from-purple-400 to-violet-500',
  阅读专项: 'from-blue-400 to-indigo-500',
  古诗词专项选择题: 'from-amber-400 to-yellow-500',
  字词专项选择题: 'from-yellow-400 to-orange-500',
  句子专项选择题: 'from-emerald-400 to-teal-500',
  诗词: 'from-amber-400 to-yellow-500',
  字音辨析: 'from-pink-400 to-rose-500',
  '字义、词语理解': 'from-yellow-400 to-orange-500',
  字形辨析: 'from-orange-400 to-amber-500',
  词语运用: 'from-yellow-400 to-orange-500',
  课内外阅读书目常识: 'from-cyan-400 to-blue-500',
  词语练习: 'from-yellow-400 to-orange-500',
  诗词练习: 'from-amber-400 to-yellow-500',
  填空题: 'from-emerald-400 to-teal-500',
  判断题: 'from-green-400 to-emerald-500',
  选择题: 'from-sky-400 to-cyan-500',
  默写题: 'from-violet-400 to-purple-500',
};

export default function TypeSelector({ grade, selectedType, onSelect }: Props) {
  const availableTypes = getAvailableTypes(grade);

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📋</span>
        <h2 className="font-bold text-gray-700">选择题型</h2>
        <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
          点击即可出题
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {availableTypes.map(type => {
          const count = getQuestionsByGradeAndType(grade, type).length;
          const isSelected = selectedType === type;
          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={`
                group relative flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200
                hover:scale-[1.02] hover:shadow-md active:scale-95 text-left
                ${isSelected
                  ? 'border-transparent shadow-md scale-[1.02]'
                  : 'bg-white border-gray-100 hover:border-amber-200'
                }
              `}
              style={isSelected ? {
                background: 'linear-gradient(135deg, #fff8e1, #fff3cd)',
                borderColor: '#f5c842',
              } : undefined}
            >
              <div className={`
                w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                bg-gradient-to-br ${typeColors[type]} text-white shadow-sm
              `}>
                {typeEmojis[type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm ${isSelected ? 'text-amber-700' : 'text-gray-700'}`}>
                  {subjectTypeLabels[type]}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{count} 道题</div>
              </div>
              {isSelected && (
                <span className="absolute top-2 right-2 text-amber-500 text-sm">●</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
