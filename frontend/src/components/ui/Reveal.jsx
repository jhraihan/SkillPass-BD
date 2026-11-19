import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

const canObserve = () => typeof window !== 'undefined' && 'IntersectionObserver' in window;

export default function Reveal({ as: Component = 'div', delay = 0, className, style, ...props }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => !canObserve());

  useEffect(() => {
    const node = ref.current;
    if (visible || !node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <Component
      ref={ref}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      className={cn('reveal', visible && 'is-visible', className)}
      {...props}
    />
  );
}
