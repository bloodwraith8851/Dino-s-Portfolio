import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Terminal as TerminalIcon, Shield, Mail, FileCode2, Cpu, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
const SnakeGame = React.lazy(() => import('./SnakeGame'));
const VisitorMap = React.lazy(() => import('./VisitorMap'));
import { sanitizeHTML } from '../terminal/sanitize';
import { processCommand } from '../terminal/commandProcessor';

// Terminal components
import { TerminalLine } from '../terminal/components/TerminalLine';
import { TerminalInput } from '../terminal/components/TerminalInput';
import { TerminalTitleBar } from '../terminal/components/TerminalTitleBar';

// Terminal hooks
import { useTerminalCore } from '../terminal/hooks/useTerminalCore';
import { useAdminAuth } from '../terminal/hooks/useAdminAuth';
import { useHireWizard } from '../terminal/hooks/useHireWizard';
import { useChatMode } from '../terminal/hooks/useChatMode';
import { useRealtimeFeeds } from '../terminal/hooks/useRealtimeFeeds';

export default function ContactSection() {
  const [visitorName, setVisitorName] = useState<string>('');
  const [isSnakeMode, setIsSnakeMode] = useState(false);
  const [isMapMode, setIsMapMode] = useState(false);
  const [isHelpMode, setIsHelpMode] = useState(false);

  // Core terminal state
  const core = useTerminalCore(visitorName);
  
  // Feature hooks
  const auth = useAdminAuth(core.addLine);
  const hire = useHireWizard(core.addLine, supabase, visitorName);
  const chat = useChatMode(core.addLine, supabase, visitorName);
  const feeds = useRealtimeFeeds(core.addLine, supabase);

  // Load visitor alias on mount
  useEffect(() => {
    const saved = localStorage.getItem('visitor_alias');
    if (saved) setVisitorName(saved);
  }, []);

  // Fetch MOTD
  useEffect(() => {
    const fetchMOTD = async () => {
      try {
        const { data } = await supabase.from('admin_settings').select('value').eq('key', 'motd').single();
        if (data?.value) {
          (window as any).__MOTD__ = data.value;
        }
      } catch (e) {
        // fail silently
      }
    };
    if (!core.isBooting) fetchMOTD();
  }, [core.isBooting, core.addLine]);

  // Command Execution
  const exec = useCallback(async (cmdStr: string) => {
    const cmd = cmdStr.trim();
    if (!cmd) return;

    core.addToHistory(cmd);
    core.addLine({ type: 'command', text: cmd, isAuth: !!auth.authStep, isHire: !!hire.hireStep, isAdmin: auth.isAdmin });

    // 1. Auth password mode
    if (auth.authStep === 'password') {
      await auth.handlePasswordSubmit(cmd);
      return;
    }

    // 2. Chat mode
    if (chat.isChatMode) {
      await chat.processChatInput(cmd);
      return;
    }

    // 3. Hire wizard mode
    if (hire.hireStep) {
      await hire.processHireInput(cmd);
      return;
    }

    // 4. Standard command processing
    const isFirstTime = !localStorage.getItem('visitor_alias') && !core.isBooting;
    
    try {
      await processCommand(
        cmdStr,
        {
          addLine: core.addLine,
          addLines: core.addLines,
          isAdmin: auth.isAdmin,
          visitorName,
          history: core.history,
          supabase,
          sanitizeHTML
        },
        {
          clearLines: core.clearLines,
          setVisitorName,
          initiateAuth: auth.initiateAuth,
          initiateHire: hire.initiateHire,
          enterChat: chat.enterChat,
          toggleLogs: feeds.toggleLogs,
          toggleWatch: feeds.toggleWatch,
          disableAllFeeds: feeds.disableAll,
          setSnakeMode: setIsSnakeMode,
          setMapMode: setIsMapMode,
          setHelpMode: setIsHelpMode,
          logout: auth.logout
        },
        { isFirstTime, isHelpMode }
      );
    } catch (err: any) {
      core.addLine({ type: 'output', text: ` <span class="t-red">EXEC ERROR: ${err?.message || 'Unknown error'}</span>` });
      console.error(err);
    }
  }, [core, auth, chat, hire, visitorName, isHelpMode, feeds]);

  // Key Handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (core.history.length > 0) core.setInput(core.history[core.history.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      core.setInput('');
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      core.setInput('');
      core.addLine({ type: 'output', text: ` <span class="t-red">^C</span>` });
      if (hire.hireStep) hire.processHireInput('cancel');
      if (chat.isChatMode) chat.processChatInput('exit');
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      core.clearLines();
    }
  };

  const handleEnter = () => {
    exec(core.input);
    core.setInput('');
  };

  // Parallax animation
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0.8, 1], [100, 0]);
  const scale = useTransform(scrollYProgress, [0.8, 1], [0.95, 1]);
  const opacity = useTransform(scrollYProgress, [0.8, 1], [0.5, 1]);

  return (
    <section id="contact" className="min-h-screen py-24 relative z-10 font-mono flex flex-col pt-24 bg-[#050505]">
      
      {/* Header */}
      <div className="text-center mb-16 relative z-10">
        <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-100 to-neutral-500">
            CONTACT
          </span>
        </h2>
        <p className="text-neutral-400 max-w-2xl mx-auto text-lg uppercase tracking-widest px-4">
          Establish a secure connection
        </p>
      </div>

      {/* Terminal Container */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 relative mb-24 z-20">
        {/* Glow effect */}
        <motion.div style={{ opacity, scale }} className="absolute -inset-1 bg-gradient-to-r from-emerald-900/40 to-blue-900/40 rounded-2xl blur-2xl transition-all duration-1000 group-hover:from-emerald-800/40 group-hover:to-blue-800/40 pointer-events-none" />
        
        <motion.div style={{ y, scale, opacity }} className="relative bg-[#050505] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[80vh] min-h-[600px] terminal-body">
          <TerminalTitleBar />

          {/* Terminal Body */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-sm sm:text-base scroll-smooth relative" onClick={() => !isSnakeMode && !isMapMode && core.bottomRef.current?.scrollIntoView()}>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_50%,transparent_50%)] bg-[length:100%_4px] pointer-events-none z-50 opacity-50 mix-blend-overlay" />
            
            {isSnakeMode ? (
              <Suspense fallback={<div className="text-neutral-500 p-4">Loading Snake Game...</div>}>
                <SnakeGame 
                  onExit={() => {
                    setIsSnakeMode(false);
                    core.addLine({ type: 'output', text: ` <span class="t-dim">Exited Snake Game.</span>` });
                  }} 
                  visitorName={visitorName || 'visitor'} 
                />
              </Suspense>
            ) : isMapMode ? (
              <div className="w-full h-full relative">
                <Suspense fallback={<div className="text-neutral-500 p-4">Loading Global Network Map...</div>}>
                  <VisitorMap onClose={() => setIsMapMode(false)} />
                </Suspense>
              </div>
            ) : (
              <>
                {core.lines.map((line, i) => (
                  <TerminalLine key={i} line={line} index={i} />
                ))}

                {!core.isBooting && (
                  <TerminalInput 
                    input={core.input}
                    setInput={core.setInput}
                    onEnter={handleEnter}
                    onKeyDown={handleKeyDown}
                    scrollBot={core.scrollBot}
                    promptInfo={{
                      isAuth: !!auth.authStep,
                      isHire: !!hire.hireStep,
                      isChatMode: chat.isChatMode,
                      alias: visitorName,
                      isFirstTime: !localStorage.getItem('visitor_alias'),
                      isAdmin: auth.isAdmin
                    }}
                  />
                )}
                <div ref={core.bottomRef} className="h-4" />
              </>
            )}
          </div>

          {/* Bottom Hint Bar */}
          <div className="bg-[#111] border-t border-white/5 p-2 flex flex-wrap gap-2 text-xs sm:text-sm text-neutral-500 font-mono shrink-0 justify-between items-center px-4">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => exec('help')} className="hover:text-green-400 transition-colors flex items-center gap-1"><TerminalIcon size={14}/> help</button>
              <span className="hidden sm:inline opacity-30">|</span>
              <button onClick={() => exec('contact')} className="hover:text-cyan-400 transition-colors flex items-center gap-1"><Mail size={14}/> contact</button>
              <span className="hidden sm:inline opacity-30">|</span>
              <button onClick={() => exec('hire')} className="hover:text-yellow-400 transition-colors flex items-center gap-1"><Shield size={14}/> hire</button>
              <span className="hidden sm:inline opacity-30">|</span>
              <button onClick={() => exec('skills')} className="hover:text-purple-400 transition-colors flex items-center gap-1"><FileCode2 size={14}/> skills</button>
            </div>
            
            <div className="flex flex-wrap gap-2 text-neutral-600">
              <button onClick={() => exec('joke')} className="hover:text-white transition-colors flex items-center gap-1"><Cpu size={14}/> joke</button>
              <span className="opacity-30">|</span>
              <button onClick={() => exec('matrix')} className="hover:text-green-500 transition-colors flex items-center gap-1"><Globe size={14}/> matrix</button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="text-center text-neutral-600 text-sm mt-auto pb-8 font-mono relative z-10">
        <p>© 2026 RAKESH SARKAR</p>
        <p className="mt-1 opacity-50">DESIGNED & BUILT IN DELHI</p>
      </div>
    </section>
  );
}
