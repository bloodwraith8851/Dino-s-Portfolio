import { useRef } from 'react';
import type { CSSProperties } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';

interface AnimatedTextProps {
  text: string;
  className?: string;
  style?: CSSProperties;
}

interface CharProps {
  char: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}

const Char = ({ char, index, total, progress }: CharProps) => {
  const start = index / total;
  const end = start + 1 / total;
  const opacity = useTransform(progress, [start, end], [0.2, 1]);

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{ opacity: 0.2 }}>{char}</span>
      <motion.span
        style={{
          opacity,
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
        }}
        aria-hidden="true"
      >
        {char}
      </motion.span>
    </span>
  );
};

const AnimatedText = ({ text, className, style }: AnimatedTextProps) => {
  const ref = useRef<HTMLParagraphElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  });

  // Build word list with each word's starting character index pre-computed
  const words = text.split(' ');
  const totalChars = text.length;
  const wordOffsets = words.reduce<number[]>((acc, _, i) => {
    const prev = i === 0 ? 0 : (acc[i - 1] ?? 0) + words[i - 1].length + 1;
    acc.push(prev);
    return acc;
  }, []);

  return (
    <p ref={ref} className={className} style={style}>
      {words.map((word, wi) => {
        const wordChars = Array.from(word);
        const wordStart = wordOffsets[wi] ?? 0;

        return (
          <span key={wi} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {wordChars.map((ch, ci) => (
              <Char key={ci} char={ch} index={wordStart + ci} total={totalChars} progress={scrollYProgress} />
            ))}
            {wi < words.length - 1 && '\u00A0'}
          </span>
        );
      })}
    </p>
  );
};

export default AnimatedText;
