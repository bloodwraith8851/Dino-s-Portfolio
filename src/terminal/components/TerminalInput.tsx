import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TerminalInputProps {
  input: string;
  setInput: (val: string) => void;
  onEnter: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  promptInfo: {
    isAuth: boolean;
    isHire: boolean;
    isChatMode: boolean;
    isAiChatMode: boolean;
    alias: string;
    isFirstTime: boolean;
    isAdmin: boolean;
  };
  scrollBot: () => void;
}

export function TerminalInput({ input, setInput, onEnter, onKeyDown, promptInfo, scrollBot }: TerminalInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus on the input field when clicking anywhere within the terminal
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (window.getSelection()?.toString()) return; // allow selecting text
      // Only focus if clicking inside the terminal container
      const target = e.target as HTMLElement;
      if (target.closest('.terminal-body')) {
        inputRef.current?.focus();
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const { isAuth, isHire, isChatMode, isAiChatMode, alias, isFirstTime, isAdmin } = promptInfo;

  let prompt = '';
  let color = '';

  if (isFirstTime) {
    prompt = 'identity@rakesh.dev';
    color = 't-cyan';
  } else if (isAuth || isAdmin) {
    prompt = 'root@rakesh.dev';
    color = 't-green';
  } else if (isHire) {
    prompt = 'hire@rakesh.dev';
    color = 't-cyan';
  } else if (isAiChatMode) {
    prompt = 'dino@ai';
    color = 't-cyan';
  } else if (isChatMode) {
    prompt = 'global_chat';
    color = 't-purple';
  } else {
    prompt = `${alias || 'visitor'}@rakesh.dev`;
    color = 't-green';
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onEnter();
    } else {
      onKeyDown(e);
      scrollBot();
    }
  };

  return (
    <div className="flex w-full mt-2 relative items-center">
      <span className={`${color} mr-2`}>{prompt}</span>
      <span className="t-purple mr-2">{isChatMode || isAiChatMode || isAdmin || isAuth ? '#' : '~'}</span>
      <span className="t-white font-bold">$&gt;</span>

      <div className="relative flex-1 ml-2 flex items-center">
        <span className="t-white whitespace-pre absolute inset-y-0 left-0 flex items-center pointer-events-none">
          {isAuth ? '•'.repeat(input.length) : input}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            className="inline-block w-2.5 h-4 bg-green-500 ml-1 translate-y-[2px]"
          />
        </span>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            scrollBot();
          }}
          onKeyDown={handleInputKeyDown}
          className="w-full bg-transparent text-transparent caret-transparent outline-none border-none z-10"
          autoComplete="off"
          spellCheck="false"
          role="textbox"
          aria-label="Terminal input"
        />
      </div>
    </div>
  );
}
