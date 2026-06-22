'use client';

import { Button } from '@repo/ui/button';

import { ArrowRight } from 'lucide-react';

import { CtaButton, fadeUp } from '@/components/cta-button';
import { DashboardMockup } from '@/components/mockup';
import { StatCell } from '@/components/stat-cell';
import { useInView } from '@/hooks/use-in-view';

const STATS = [
  { value: '2.3s', label: 'Avg Dispatch Time' },
  { value: '50K+', label: 'Lives Protected' },
  { value: '99.9%', label: 'Uptime' },
  { value: '500+', label: 'Organizations' },
];

export function HeroSection() {
  const { ref, inView } = useInView(0.1);

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div
            ref={ref as React.RefObject<HTMLDivElement>}
            style={fadeUp(inView, 0)}
          >
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Emergency Response Platform
            </p>
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-7xl">
              Dispatch in <span className="text-primary">under 3 seconds.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              ResQConnect bridges the gap between people in distress and the
              responders who can help them — instantly, reliably, at scale.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaButton href="#contact">Book a Demo</CtaButton>
              <Button variant="outline" size="lg" asChild>
                <a href="#how-it-works" className="inline-flex items-center">
                  See How It Works
                </a>
              </Button>
            </div>
          </div>

          <div className="hidden lg:block" style={fadeUp(inView, 200)}>
            <DashboardMockup />
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-px border-border bg-border md:grid-cols-4">
          {STATS.map((s, i) => (
            <StatCell
              key={s.label}
              value={s.value}
              label={s.label}
              delay={i * 150}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
