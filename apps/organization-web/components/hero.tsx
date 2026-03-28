import { Play, Star } from 'lucide-react';
import Image from 'next/image';

import DeviceMockup from '@/assets/images/mobile-cta.png';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="bg-white dark:bg-background">
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Emergency Response in Seconds
            </span>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
              Connect to Help <br /> Every{' '}
              <span className="text-primary">Second</span> Counts
            </h1>
            <p className="max-w-[520px] text-base leading-relaxed text-muted-foreground">
              ResQConnect instantly connects you to emergency responders,
              medical professionals, and loved ones with a single tap.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button size="lg" className="h-12 px-8">
                <svg
                  className="mr-2 h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 16.56 2.93 11.3 4.7 7.72C5.57 5.94 7.36 4.86 9.28 4.84C10.56 4.82 11.78 5.72 12.57 5.72C13.36 5.72 14.85 4.62 16.4 4.8C17.06 4.83 18.9 5.07 20.07 6.76C19.95 6.84 17.62 8.23 17.65 11.04C17.68 14.38 20.57 15.47 20.6 15.48C20.57 15.56 20.14 17.03 19.08 18.54L18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                </svg>
                Download for iOS
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8">
                <Play className="mr-2 h-4 w-4 fill-current" />
                Download for Android
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <Avatar key={i} className="h-8 w-8 border-2 border-secondary">
                    <AvatarImage src="/assets/images/user.png" />
                    <AvatarFallback className="text-[10px]">
                      U{i}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                  <span className="ml-1 text-sm font-semibold text-foreground">
                    4.9/5
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  50,000+ Lives Protected
                </p>
              </div>
            </div>
          </div>
          <div className="relative mx-auto lg:ml-auto">
            <div className="relative z-10 overflow-hidden ">
              <Image
                src={DeviceMockup}
                alt="ResQConnect Mobile App"
                className="h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
