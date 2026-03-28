'use client';

import { Play } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function CTA() {
  return (
    <section id="download" className="bg-[#1a1a1a] py-20 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
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
                className="h-12 bg-white text-[#1a1a1a] hover:bg-white/90"
                asChild
              >
                <Link href="/signup">
                  <svg
                    className="mr-2 h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 16.56 2.93 11.3 4.7 7.72C5.57 5.94 7.36 4.86 9.28 4.84C10.56 4.82 11.78 5.72 12.57 5.72C13.36 5.72 14.85 4.62 16.4 4.8C17.06 4.83 18.9 5.07 20.07 6.76C19.95 6.84 17.62 8.23 17.65 11.04C17.68 14.38 20.57 15.47 20.6 15.48C20.57 15.56 20.14 17.03 19.08 18.54L18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                  </svg>
                  App Store
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                asChild
              >
                <Link href="/signup">
                  <Play className="mr-2 h-4 w-4 fill-current" /> Google Play
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-start gap-6">
            <div className="w-full border-t border-white/10 pt-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-2xl font-bold">10K+</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
                    Active Users
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">500+</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
                    Organizations
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">99.9%</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
                    Uptime
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">24/7</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
                    Support
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
