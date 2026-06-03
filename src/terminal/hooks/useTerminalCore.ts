import { useState, useCallback, useRef, useEffect } from 'react';
import type { Line } from '../types';
import { BOOT } from '../constants';

export function useTerminalCore(_visitorName: string) {
  const [lines, setLines] = useState<Line[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [isBooting, setIsBooting] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollBot = useCallback(() => {
    setTimeout(() => {
      if (bottomRef.current) {
        const container = bottomRef.current.closest('.overflow-y-auto');
        if (container) {
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
      }
    }, 50);
  }, []);

  const addLine = useCallback(
    (line: Line) => {
      setLines((prev) => [...prev, line]);
      scrollBot();
    },
    [scrollBot],
  );

  const addLines = useCallback(
    (newLines: Line[], gapMs = 100) => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < newLines.length) {
          const line = newLines[i];
          i++;
          setLines((prev) => [...prev, line]);
          scrollBot();
        } else {
          clearInterval(interval);
        }
      }, gapMs);
    },
    [scrollBot],
  );

  const clearLines = useCallback(() => {
    setLines([]);
  }, []);

  const addToHistory = useCallback((cmd: string) => {
    setHistory((prev) => [...prev, cmd]);
  }, []);

  // Boot Sequence Effect
  useEffect(() => {
    let timeoutIds: NodeJS.Timeout[] = [];
    let cumulativeDelay = 0;

    BOOT.forEach((step) => {
      cumulativeDelay += step.d;
      const id = setTimeout(() => {
        if (step.cmd) {
          addLine({ type: 'command', text: step.cmd, isTyping: true });
        } else if (step.ascii) {
          addLine({ type: 'ascii', text: step.ascii });
        } else if (step.out) {
          addLine({ type: 'output', text: step.out });
        }
      }, cumulativeDelay);
      timeoutIds.push(id);
    });

    const finalId = setTimeout(() => {
      setIsBooting(false);
      const isFirstTime = !localStorage.getItem('visitor_alias');
      if (isFirstTime) {
        addLine({ type: 'output', text: `\\n <span class="t-cyan font-bold">--- INITIALIZATION SEQUENCE ---</span>` });
        addLine({ type: 'output', text: ` <span class="t-dim">Identity required to access portfolio network.</span>` });
        addLine({ type: 'output', text: ` <span class="t-green">Please enter your alias or name:</span>` });
      }
    }, cumulativeDelay + 200);
    timeoutIds.push(finalId);

    return () => timeoutIds.forEach(clearTimeout);
  }, [addLine]);

  return {
    lines,
    history,
    input,
    setInput,
    isBooting,
    bottomRef,
    addLine,
    addLines,
    clearLines,
    addToHistory,
    scrollBot,
  };
}
