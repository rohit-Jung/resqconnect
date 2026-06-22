'use client';

import { Clock, MapPin, Navigation, Shield } from 'lucide-react';

import { fadeUp } from '@/components/cta-button';
import { useInView } from '@/hooks/use-in-view';

const PROBLEMS = [
  'Uncertain caller location',
  'Medical history repeated each time',
  'No visibility for responders en route',
  'Single-point-of-failure dispatch',
];

const SOLUTIONS = [
  {
    icon: MapPin,
    title: 'Precise location',
    desc: 'GPS + H3 spatial indexing.',
  },
  {
    icon: Clock,
    title: 'Instant dispatch',
    desc: 'Sub-second broadcast to all nearby responders.',
  },
  {
    icon: Shield,
    title: 'Medical profile',
    desc: 'Shared with responders at dispatch.',
  },
  {
    icon: Navigation,
    title: 'Live tracking',
    desc: 'Both parties on the map, real-time.',
  },
];

export function ProblemSection() {
  const { ref, inView } = useInView(0.2);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="border-b border-border py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-destructive tracking-wide">
              The Problem
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
              Emergency response today relies on phone calls.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              A panicked caller, an unclear location, a single dispatcher — the
              average call takes 60–90 seconds just to get an address. In a
              crisis, that is an eternity.
            </p>
            <ul className="mt-8 space-y-3">
              {PROBLEMS.map((item, i) => (
                <li
                  key={item}
                  className="flex items-start gap-3 border-l-2 border-destructive/40 pl-4 text-sm text-muted-foreground transition-all duration-500"
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'translateX(0)' : 'translateX(-8px)',
                    transitionDelay: `${i * 80}ms`,
                  }}
                >
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={fadeUp(inView, 100)}>
            <p className="text-sm font-medium text-primary tracking-wide">
              The Solution
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
              ResQConnect eliminates the delay.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              One tap sends GPS location, medical info, and emergency contacts
              to the nearest available responders — in under three seconds.
            </p>
            <div className="mt-8 space-y-4">
              {SOLUTIONS.map((item, i) => (
                <div
                  key={item.title}
                  className="group flex gap-3 border-l-2 border-primary/30 pl-4 transition-all duration-300 hover:border-primary hover:pl-5"
                  style={fadeUp(inView, 200 + i * 80, 12)}
                >
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform duration-300 group-hover:scale-110" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
