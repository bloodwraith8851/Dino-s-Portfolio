import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode, ElementType, CSSProperties } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

/**
 * Scroll-triggered fade-in wrapper using Framer Motion.
 * Respects the OS-level "Reduce Motion" preference — when enabled,
 * animations run at duration 0 and no positional offset is applied,
 * making the content appear instantly without any movement.
 *
 * @param children - Content to animate.
 * @param delay    - Animation delay in seconds (default 0).
 * @param duration - Animation duration in seconds (default 0.5).
 * @param x        - Horizontal offset in px to animate from (default 0).
 * @param y        - Vertical offset in px to animate from (default 30).
 * @param as       - HTML element or component to render as (default 'div').
 * @param className - Optional CSS class names.
 * @param style     - Optional inline styles.
 */
const FadeIn = ({ children, delay = 0, duration = 0.5, x = 0, y = 30, as = 'div', className, style }: FadeInProps) => {
  const prefersReducedMotion = useReducedMotion();

  // motion.create() must be called outside of render — memoize based on the `as` prop.
  // This satisfies react-hooks/static-components and avoids creating new components each render.
  const MotionComponent = useMemo(() => motion.create(as), [as]);

  // When the user has enabled "Reduce Motion", skip all transforms and
  // run with zero duration so content is immediately visible.
  const effectiveX = prefersReducedMotion ? 0 : x;
  const effectiveY = prefersReducedMotion ? 0 : y;
  const effectiveDuration = prefersReducedMotion ? 0 : duration;

  return (
    <MotionComponent
      initial={{ opacity: 0, transform: `translate3d(${effectiveX}px, ${effectiveY}px, 0) scale(0.95)` }}
      whileInView={{ opacity: 1, transform: 'translate3d(0px, 0px, 0) scale(1)' }}
      viewport={{ once: true, margin: '-20px', amount: 0 }}
      transition={{
        delay: prefersReducedMotion ? 0 : delay,
        duration: effectiveDuration,
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
