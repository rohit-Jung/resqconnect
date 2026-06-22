import { Button } from '@repo/ui/button';

import { ArrowRight } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

export function CtaButton({
  href,
  children,
  variant = 'default',
}: {
  href: string;
  children: ReactNode;
  variant?: 'default' | 'outline';
}) {
  return (
    <Button size="lg" variant={variant} className="group relative" asChild>
      <a href={href} className="inline-flex items-center">
        <span>{children}</span>
        <ArrowRight className="h-4 w-4 transition-all duration-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0" />
      </a>
    </Button>
  );
}

export function fadeUp(inView: boolean, delay = 0, dist = 24): CSSProperties {
  return {
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : `translateY(${dist}px)`,
    transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
  };
}
