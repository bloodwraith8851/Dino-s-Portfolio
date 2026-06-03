import { useState, useEffect } from 'react';

interface TypewriterSpanProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export function TypewriterSpan({ text, speed = 30, onComplete }: TypewriterSpanProps) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.substring(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return <span>{displayed}</span>;
}
