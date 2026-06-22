'use client';

import { AnimatedStepIcon, ICONS } from '@/components/animated-circuit';
import { fadeUp } from '@/components/cta-button';
import { useInView } from '@/hooks/use-in-view';

const STEPS = [
  {
    num: '01',
    title: 'User requests help',
    desc: 'A single tap from the app. GPS, medical profile, and contacts are sent instantly.',
    icon: ICONS.phone,
  },
  {
    num: '02',
    title: 'System finds responders',
    desc: 'H3 spatial indexing locates the nearest available responders in milliseconds.',
    icon: ICONS.mapPin,
  },
  {
    num: '03',
    title: 'Responders are alerted',
    desc: 'All qualified responders receive the alert via real-time push. First to accept wins.',
    icon: ICONS.radio,
  },
  {
    num: '04',
    title: 'Live response unfolds',
    desc: 'Responder navigates to location. Both parties track each other end-to-end.',
    icon: ICONS.navigation,
  },
];

export function HowItWorksSection() {
  const { ref, inView } = useInView(0.1);

  return (
    <section
      id="how-it-works"
      ref={ref as React.RefObject<HTMLElement>}
      className="border-b border-border py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            From alert to response in{' '}
            <span className="text-primary">under 3 seconds.</span>
          </h2>
        </div>

        <div className="mt-16 space-y-0">
          {STEPS.map((step, idx) => (
            <div
              key={step.num}
              className="group grid gap-4 border-t border-border py-8 transition-all duration-300 hover:border-primary/30 md:grid-cols-[48px_4rem_1fr] md:py-10 md:gap-6"
              style={fadeUp(inView, idx * 120, 16)}
            >
              <div className="flex items-start justify-center pt-0.5 transition-transform duration-300 group-hover:scale-110 md:justify-start">
                <AnimatedStepIcon path={step.icon} delay={idx * 200} />
              </div>
              <p className="font-mono text-sm text-muted-foreground text-center transition-colors duration-300 group-hover:text-foreground md:text-left">
                {step.num}
              </p>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
