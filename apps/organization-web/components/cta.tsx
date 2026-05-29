'use client';

import { Button } from '@repo/ui/button';

import Link from 'next/link';
import { FaAndroid, FaApple } from 'react-icons/fa';

import { useInView } from '@/hooks/use-in-view';

const STATS = [
  { value: '10K+', label: 'Active Users' },
  { value: '500+', label: 'Organizations' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
];

export function CTA() {
  const { ref: sectionRef, inView } = useInView(0.1);

  return (
    <section
      id="download"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="bg-[#1a1a1a] py-20 text-white"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left */}
          <div
            className={`space-y-6 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              Download the App
            </span>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to Feel Safer?
            </h2>
            <p className="max-w-md text-base leading-relaxed text-white/60">
              Join thousands who trust ResQConnect to keep them and their loved
              ones safe. Download now and get peace of mind in your pocket.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                size="lg"
                className="h-12 bg-white text-[#1a1a1a] hover:bg-white/90 gap-2"
                asChild
              >
                <Link href="/signup">
                  <FaApple className="h-5 w-5" />
                  App Store
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white gap-2"
                asChild
              >
                <Link href="/signup">
                  <FaAndroid className="h-4 w-4" />
                  Google Play
                </Link>
              </Button>
            </div>
          </div>

          {/* Right — staggered stats */}
          <div className="w-full border-t border-white/10 pt-6">
            <div className="grid grid-cols-2 gap-6">
              {STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  className="transition-all duration-700"
                  style={{
                    transitionDelay: `${i * 100}ms`,
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'translateY(0)' : 'translateY(20px)',
                  }}
                >
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
