'use client';

import { Button } from '@repo/ui/button';
import { Card } from '@repo/ui/card';

import { ArrowRight, Search } from 'lucide-react';

import { fadeUp } from '@/components/cta-button';
import { useInView } from '@/hooks/use-in-view';

const SECTORS = [
  'Hospital / Medical',
  'Fire & Rescue',
  'Police & Law Enforcement',
];

export function OrganizationsSection() {
  const { ref, inView } = useInView(0.2);

  return (
    <section
      id="organizations"
      ref={ref as React.RefObject<HTMLElement>}
      className="border-b border-border py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Your dedicated{' '}
              <span className="text-primary">command center.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Every organization gets its own isolated, compliant, customizable
              operational silo — fire, hospital, or police.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {SECTORS.map(s => (
                <span
                  key={s}
                  className="rounded-full border border-border px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:text-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <Card
            className="p-6 transition-all duration-300 hover:shadow-md"
            style={fadeUp(inView, 100)}
          >
            <p className="text-sm font-semibold text-foreground">
              Find your organization
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition-all duration-300 focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>
              <Button size="default" asChild>
                <a href="#" className="inline-flex items-center">
                  Search
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              New organization?{' '}
              <a
                href="#contact"
                className="text-primary underline underline-offset-2 transition-all duration-300 hover:opacity-80"
              >
                Contact us
              </a>{' '}
              to set up your silo.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
