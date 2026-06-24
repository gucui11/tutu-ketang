import type { Grade } from '../data/questionBank';
import { gradeColors } from '../data/questionBank';

interface Props {
  selectedGrade: Grade | null;
  onSelect: (grade: Grade) => void;
}

const grades: { grade: Grade; label: string; emoji: string; desc: string }[] = [
  { grade: 1, label: '一年级', emoji: '🌱', desc: '拼音·识字·组词' },
  { grade: 2, label: '二年级', emoji: '🌿', desc: '组词·造句·阅读' },
  { grade: 3, label: '三年级', emoji: '🍀', desc: '词语·阅读·写作' },
  { grade: 4, label: '四年级', emoji: '🌲', desc: '辨析·修辞·写作' },
  { grade: 5, label: '五年级', emoji: '🌳', desc: '议论·鉴赏·写作' },
  { grade: 6, label: '六年级', emoji: '🎓', desc: '综合·冲刺·备考' },
];

export default function GradeSelector({ selectedGrade, onSelect }: Props) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🎓</span>
        <h2 className="font-bold text-gray-700">选择年级</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {grades.map(({ grade, label, emoji, desc }) => {
          const colors = gradeColors[grade];
          const isSelected = selectedGrade === grade;
          return (
            <button
              key={grade}
              onClick={() => onSelect(grade)}
              className={`
                relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border-2 transition-all duration-200
                hover:scale-105 hover:shadow-md active:scale-95
                ${isSelected
                  ? `${colors.bg} ${colors.border} shadow-md scale-105`
                  : 'bg-white border-gray-100 hover:border-amber-200'
                }
              `}
            >
              {isSelected && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs">
                  ✓
                </span>
              )}
              <span className="text-2xl">{emoji}</span>
              <span className={`text-sm font-bold ${isSelected ? colors.text : 'text-gray-700'}`}>
                {label}
              </span>
              <span className="text-xs text-gray-400 text-center leading-tight hidden sm:block">{desc}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
