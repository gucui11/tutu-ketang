import { useState } from 'react';
import Header from './components/Header';
import GradeSelector from './components/GradeSelector';
import GradePage from './components/GradePage';
import EmptyState from './components/EmptyState';
import { questionBank } from './data/questionBank';
import type { Grade } from './data/questionBank';

type AppView = 'home' | 'grade';

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  // 点击年级 → 进入年级专属页面
  const handleGradeSelect = (grade: Grade) => {
    setSelectedGrade(grade);
    setView('grade');
  };

  // 从年级页面返回首页
  const handleBackToHome = () => {
    setView('home');
    setSelectedGrade(null);
  };

  const totalQuestions = questionBank.length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #fef9ec 0%, #fff8e1 50%, #fff3cd 100%)' }}>
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {/* 首页：年级选择 */}
        {view === 'home' && (
          <div className="space-y-6 animate-slide-up">
            <div className="card bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <div className="flex items-start gap-4">
                <div className="text-4xl">📚</div>
                <div>
                  <h2 className="text-lg font-bold text-amber-800 mb-1">欢迎使用途途课堂赛前练习平台</h2>
                  <p className="text-sm text-amber-700">
                    专为小学语文设计 · 一至六年级题库 · 实时答案解析
                  </p>
                  <div className="mt-2 flex gap-3 text-xs text-amber-600 flex-wrap">
                    <span className="bg-amber-100 px-2 py-0.5 rounded-full">🎓 6个年级</span>
                    <span className="bg-amber-100 px-2 py-0.5 rounded-full">📖 共 {totalQuestions} 道例题</span>
                    <span className="bg-amber-100 px-2 py-0.5 rounded-full">🎯 6大题型</span>
                    <span className="bg-amber-100 px-2 py-0.5 rounded-full">👩‍🏫 名师指导</span>
                  </div>
                </div>
              </div>
            </div>

            <GradeSelector
              selectedGrade={selectedGrade}
              onSelect={handleGradeSelect}
            />

            {!selectedGrade && <EmptyState />}
          </div>
        )}

        {/* 年级专属页面（带老师名片） */}
        {view === 'grade' && selectedGrade && (
          <GradePage
            grade={selectedGrade}
            onBack={handleBackToHome}
          />
        )}
      </main>

      <footer className="text-center py-4 text-xs text-amber-400">
        途途课堂赛前练习平台 · 小学语文专用 · 一至六年级全覆盖 · 让每次练习都有意义
      </footer>
    </div>
  );
}
