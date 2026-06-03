export function TerminalTitleBar() {
  return (
    <div className="flex items-center px-4 py-2 bg-[#1a1a1a] border-b border-white/5 rounded-t-xl shrink-0">
      <div className="flex space-x-2">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
      </div>
      <div className="flex-1 text-center text-xs text-neutral-500 font-mono flex items-center justify-center gap-2">
        <span>terminal.rakesh.dev — bash</span>
      </div>
    </div>
  );
}
