import { useState } from 'react';
import type { Grade, Question } from '../data/questionBank';
import { gradeColors, getQuestionsByGradeAndType } from '../data/questionBank';
import { teachers, type Teacher } from '../data/teachers';
import TypeSelector from './TypeSelector';
import QuestionCard from './QuestionCard';

interface Props {
  grade: Grade;
  onBack: () => void;
}

const gradeInfo: Record<Grade, { label: string; emoji: string; desc: string }> = {
  1: { label: '一年级', emoji: '🌱', desc: '拼音·识字·组词' },
  2: { label: '二年级', emoji: '🌿', desc: '组词·造句·阅读' },
  3: { label: '三年级', emoji: '🍀', desc: '词语·阅读·写作' },
  4: { label: '四年级', emoji: '🌲', desc: '辨析·修辞·写作' },
  5: { label: '五年级', emoji: '🌳', desc: '议论·鉴赏·写作' },
  6: { label: '六年级', emoji: '🎓', desc: '综合·冲刺·备考' },
};

export default function GradePage({ grade, onBack }: Props) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());

  const info = gradeInfo[grade];
  const colors = gradeColors[grade];
  const teacher: Teacher = teachers[grade];

  const pickQuestion = (type: string) => {
    const pool = getQuestionsByGradeAndType(grade, type);
    const unused = pool.filter(q => !usedIds.has(q.id));
    const source = unused.length > 0 ? unused : pool;
    if (source.length === 0) return;
    const q = source[Math.floor(Math.random() * source.length)];
    setCurrentQuestion(q);
    setUsedIds(prev => new Set([...prev, q.id]));
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    pickQuestion(type);
  };

  const handleNextQuestion = () => {
    if (selectedType) pickQuestion(selectedType);
  };

  const handleBackToGrade = () => {
    setCurrentQuestion(null);
    setSelectedType(null);
  };

  // 题目显示页
  if (currentQuestion) {
    return (
      <div className="animate-slide-up">
        <QuestionCard
          question={currentQuestion}
          onBack={handleBackToGrade}
          onNext={handleNextQuestion}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-slide-up">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-full hover:bg-white/60"
        >
          <span>←</span> 返回首页
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-2xl">{info.emoji}</span>
          <span className={`text-lg font-bold ${colors.text}`}>{info.label}</span>
        </div>
      </div>

      {/* 主讲老师名片 */}
      <TeacherCard teacher={teacher} colors={colors} />

      {/* 途途课堂下载链接 */}
      <a
        href="http://xuexi859.com/a/8YgcGLW"
        target="_blank"
        rel="noopener noreferrer"
        className={`block card border-2 ${colors.border} hover:shadow-md transition-shadow`}
        style={{ background: 'white' }}
      >
        <div className="px-5 py-3.5 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center text-lg flex-shrink-0`}>
            📲
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${colors.text}`}>途途课堂</p>
            <p className="text-xs text-gray-400">下载途途课堂软件，登录领取免费赛前视频课，参与全国练习pk！</p>
          </div>
          <div className="flex-shrink-0">
            <span className={`text-xs px-3 py-1.5 rounded-full ${colors.badge} font-medium`}>
              立即下载 →
            </span>
          </div>
        </div>
      </a>

      {/* 题型选择 */}
      <TypeSelector
        grade={grade}
        selectedType={selectedType}
        onSelect={handleTypeSelect}
      />
    </div>
  );
}

function TeacherCard({ teacher, colors }: { teacher: Teacher; colors: { bg: string; text: string; border: string; badge: string } }) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      <div className={`card border-2 ${colors.border} overflow-hidden`} style={{ background: 'white' }}>
        {/* 卡片头部 */}
        <div className={`px-5 py-3 ${colors.bg} border-b ${colors.border}`}>
          <div className="flex items-center gap-2">
            <span className="text-sm">👩‍🏫</span>
            <span className={`text-xs font-bold ${colors.text} uppercase tracking-wider`}>主讲老师</span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* 可点击放大的真实照片 */}
            <button
              onClick={() => setIsZoomed(true)}
              className="group relative flex-shrink-0 cursor-zoom-in focus:outline-none"
              title="点击放大"
            >
              <img
                src={teacher.photoUrl}
                alt={teacher.name}
                className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-white group-hover:scale-105 transition-transform"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              {/* 放大提示图标 */}
              <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>
              </div>
              <div
                className={`w-20 h-20 rounded-2xl ${teacher.avatarBg} items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg`}
                style={{ display: 'none' }}
              >
                {teacher.avatar}
              </div>
            </button>

          {/* 基本信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-gray-800">{teacher.name}</h3>
              <span className="text-sm text-gray-400">（{teacher.nickname}）</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                {teacher.title}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
              <span>📅 {teacher.years}年教龄</span>
              <span>🏆 资深教师</span>
            </div>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              {teacher.bio}
            </p>
          </div>
        </div>

        {/* 教学特色 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-400">🎯</span>
            <span className="text-xs font-semibold text-gray-500">教学特色</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {teacher.specialties.map(sp => (
              <span key={sp} className={`text-xs px-2.5 py-1 rounded-full ${colors.bg} ${colors.text} font-medium`}>
                {sp}
              </span>
            ))}
          </div>
        </div>

        {/* 教学格言 */}
        <div className="mt-3 flex items-start gap-2">
          <span className="text-amber-400 text-sm flex-shrink-0 mt-0.5">💬</span>
          <p className="text-xs text-gray-400 italic leading-relaxed">
            「{teacher.motto}」
          </p>
        </div>
      </div>
    </div>

      {/* 放大弹窗 */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsZoomed(false)}
        >
          {/* 关闭按钮 */}
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white text-xl flex items-center justify-center transition-colors z-10"
          >
            ✕
          </button>
          {/* 大图 */}
          <img
            src={teacher.photoUrl}
            alt={teacher.name}
            className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {/* 底部提示 */}
          <p className="absolute bottom-6 text-white/60 text-sm">
            点击任意位置关闭
          </p>
        </div>
      )}
    </>
  );
}
