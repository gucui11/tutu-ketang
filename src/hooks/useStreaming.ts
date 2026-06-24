import { useState, useRef, useCallback } from 'react';

interface UseStreamingOptions {
  speedMs?: number; // 每个字符的延迟（毫秒）
}

export function useStreaming({ speedMs = 30 }: UseStreamingOptions = {}) {
  const [displayText, setDisplayText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  const startStreaming = useCallback((fullText: string) => {
    // 重置状态
    abortRef.current = false;
    setDisplayText('');
    setIsDone(false);
    setIsStreaming(true);

    let index = 0;

    const tick = () => {
      if (abortRef.current) return;
      if (index <= fullText.length) {
        setDisplayText(fullText.slice(0, index));
        index++;
        timerRef.current = setTimeout(tick, speedMs);
      } else {
        setIsStreaming(false);
        setIsDone(true);
      }
    };

    timerRef.current = setTimeout(tick, 100); // 短暂延迟再开始
  }, [speedMs]);

  const stopStreaming = useCallback(() => {
    abortRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stopStreaming();
    setDisplayText('');
    setIsDone(false);
  }, [stopStreaming]);

  return { displayText, isStreaming, isDone, startStreaming, stopStreaming, reset };
}
