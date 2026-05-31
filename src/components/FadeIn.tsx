import { motion } from 'framer-motion';
import type { ReactNode, ElementType } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  as?: ElementType;
  className?: string;
  style?: React.CSSProperties;
}

const FadeIn = ({
  children,
  delay = 0,
  duration = 0.5,
  x = 0,
  y = 30,
  as = 'div',
  className,
  style,
}: FadeInProps) => {
  const MotionComponent = motion.create(as);

  return (
    <MotionComponent
      initial={{ opacity: 0, transform: `translate3d(${x}px, ${y}px, 0) scale(0.95)` }}
      whileInView={{ opacity: 1, transform: 'translate3d(0px, 0px, 0) scale(1)' }}
      viewport={{ once: true, margin: '-20px', amount: 0 }}
      transition={{
        delay,
        duration,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={className}
      style={style}
    >
      {children}
    </MotionComponent>
  );
};

export default FadeIn;
