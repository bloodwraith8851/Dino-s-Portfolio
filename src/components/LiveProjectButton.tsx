interface LiveProjectButtonProps {
  label?: string;
  href?: string;
  className?: string;
}

const LiveProjectButton = ({
  label = 'Live Project',
  href = '#',
  className = '',
}: LiveProjectButtonProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center rounded-full border-2 border-[#D7E2EA] px-8 py-3 sm:px-10 sm:py-3.5 text-sm sm:text-base font-medium uppercase tracking-widest text-[#D7E2EA] whitespace-nowrap transition-all duration-200 ease-out-custom hover:bg-[#D7E2EA]/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${className}`}
    >
      {label}
    </a>
  );
};

export default LiveProjectButton;
