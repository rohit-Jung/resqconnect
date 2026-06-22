'use client';

import { useEffect, useRef, useState } from 'react';

export function StatCell({
  value,
  label,
  delay,
  inView,
}: {
  value: string;
  label: string;
  delay: number;
  inView: boolean;
}) {
  const [display, setDisplay] = useState('0');
  const counted = useRef(false);

  useEffect(() => {
    if (!inView || counted.current) return;
    counted.current = true;

    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) {
      setDisplay(value);
      return;
    }

    const suffix = value.replace(/[0-9.]/g, '');
    const duration = 800;
    const start = performance.now() + delay;

    const raf = requestAnimationFrame(function tick(now) {
      if (now < start) {
        requestAnimationFrame(tick);
        return;
      }
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * num);
      setDisplay(`${current}${suffix}`);
      if (progress < 1) requestAnimationFrame(tick);
      else setDisplay(value);
    });

    return () => {
      counted.current = true;
    };
  }, [inView, value, delay]);

  return (
    <div className="bg-background p-6 transition-colors duration-300 hover:bg-secondary/50">
      <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
        {display}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
