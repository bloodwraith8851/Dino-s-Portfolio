interface ContactButtonProps {
  label?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const ContactButton = ({
  label = 'Contact Me',
  href = '#contact',
  onClick,
  className = '',
}: ContactButtonProps) => {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full bg-zinc-100 px-8 py-3 sm:px-10 sm:py-3.5 md:px-12 md:py-4 text-xs sm:text-sm md:text-base font-medium uppercase tracking-widest text-black whitespace-nowrap transition-all duration-200 ease-out-custom hover:bg-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${className}`}
    >
      {label}
    </a>
  );
};

export default ContactButton;
