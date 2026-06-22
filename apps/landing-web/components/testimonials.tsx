'use client';

import { Card } from '@repo/ui/card';

import { fadeUp } from '@/components/cta-button';
import { useInView } from '@/hooks/use-in-view';

const REVIEWS = [
  {
    name: 'Sarah Mitchell',
    initials: 'SM',
    role: 'New York, NY',
    quote:
      'When my father had a heart attack, ResQConnect sent his location and medical history to paramedics instantly. They arrived prepared and saved his life.',
  },
  {
    name: 'Marcus Johnson',
    initials: 'MJ',
    role: 'Austin, TX',
    quote:
      'Having my medical info instantly accessible to first responders gives me incredible peace of mind every day.',
  },
  {
    name: 'Emily Rodriguez',
    initials: 'ER',
    role: 'Los Angeles, CA',
    quote:
      'The silent alert feature helped me get help during a dangerous situation without escalating it. This app saved my life.',
  },
];

function Stars() {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const { ref, inView } = useInView(0.1);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="border-b border-border py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Trusted by <span className="text-primary">thousands.</span>
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {REVIEWS.map((t, idx) => (
            <Card
              key={t.name}
              className="p-6 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-md"
              style={fadeUp(inView, idx * 120)}
            >
              <Stars />
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
