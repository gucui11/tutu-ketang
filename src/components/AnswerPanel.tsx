import { useEffect, useRef } from 'react';
import { useStreaming } from '../hooks/useStreaming';

interface Props {
  answer: string;
  explanation?: string;
  trigger: number; // 每次变化触发重新流式输出
}

export default function AnswerPanel({ answer, explanation, trigger }: Props) {
  const {
    displayText: answerText,
    isStreaming: answerStreaming,
    isDone: answerDone,
    startStreaming: startAnswer,
    reset: resetAnswer,
  } = useStreaming({ speedMs: 25 });

  const {
    displayText: explainText,
    isStreaming: explainStreaming,
    startStreaming: startExplain,
    reset: resetExplain,
  } = useStreaming({ speedMs: 20 });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    resetAnswer();
    resetExplain();
    // 短暂延迟后开始答案流式输出
    const t = setTimeout(() => {
      startAnswer(answer);
    }, 300);
    return () => clearTimeout(t);
  }, [trigger, answer]);

  // 答案完成后，开始解析
  useEffect(() => {
    if (answerDone && explanation) {
      const t = setTimeout(() => {
        startExplain(explanation);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [answerDone, explanation]);

  // 自动滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [answerText, explainText]);

  return (
    <div className="space-y-4">
      {/* 答案区域 */}
      <div className="card border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm">✓</div>
          <span className="font-bold text-emerald-700">参考答案</span>
          {answerStreaming && (
            <span className="flex items-center gap-1 text-xs text-emerald-500 ml-auto">
              <span className="loading-dots">
                <span>●</span><span>●</span><span>●</span>
              </span>
              <span className="ml-1">正在输出</span>
            </span>
          )}
          {answerDone && !answerStreaming && (
            <span className="ml-auto text-xs text-emerald-400 flex items-center gap-1">
              <span>✓</span> 完成
            </span>
          )}
        </div>
        <div
          ref={containerRef}
          className="text-gray-800 leading-relaxed whitespace-pre-wrap text-[15px] min-h-[3rem] max-h-64 overflow-y-auto"
        >
          {answerText}
          {answerStreaming && (
            <span className="inline-block w-0.5 h-5 bg-emerald-500 ml-0.5 animate-pulse-soft align-middle" />
          )}
        </div>
      </div>

      {/* 解析区域 */}
      {(explainText || (answerDone && explanation)) && (
        <div className="card border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">💡</div>
            <span className="font-bold text-blue-700">解题解析</span>
            {explainStreaming && (
              <span className="flex items-center gap-1 text-xs text-blue-400 ml-auto">
                <span className="loading-dots">
                  <span>●</span><span>●</span><span>●</span>
                </span>
              </span>
            )}
          </div>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {explainText}
            {explainStreaming && (
              <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 animate-pulse-soft align-middle" />
            )}
          </p>
        </div>
      )}
    </div>
  );
}
