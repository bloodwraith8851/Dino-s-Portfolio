import { motion } from 'framer-motion';
import type { Line } from '../types';
import { TypewriterSpan } from './TypewriterSpan';

interface TerminalLineProps {
  line: Line;
  index: number;
}

export function TerminalLine({ line }: TerminalLineProps) {
  if (line.type === 'command') {
    return (
      <div className="flex w-full mb-1">
        <span className="t-green mr-2">
          {line.isAuth || line.isAdmin ? 'root@rakesh.dev' : line.isHire ? 'hire@rakesh.dev' : `${localStorage.getItem('visitor_alias') || 'visitor'}@rakesh.dev`}
        </span>
        <span className="t-purple mr-2">{line.isAdmin || line.isAuth ? '#' : '~'}</span>
        <span className="t-white font-bold">$&gt;</span>
        <span className="ml-2 t-white">
          {line.isAuth ? (
            <span className="t-dim">{'•'.repeat(line.text.length)}</span>
          ) : line.isTyping ? (
            <TypewriterSpan text={line.text} speed={40} />
          ) : (
            line.text
          )}
        </span>
      </div>
    );
  }

  if (line.type === 'ascii') {
    return (
      <motion.pre
        initial={{ filter: 'blur(10px)', opacity: 0 }}
        animate={{ filter: 'blur(0px)', opacity: 1 }}
        transition={{ duration: 1 }}
        className="t-green text-[10px] sm:text-xs md:text-sm leading-tight mb-4 select-none whitespace-pre overflow-x-hidden"
      >
        {line.text}
      </motion.pre>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="mb-1 whitespace-pre-wrap pl-2 border-l-2 border-white/10 w-full"
      dangerouslySetInnerHTML={{ __html: line.text }}
    />
  );
}
