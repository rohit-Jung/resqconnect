'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar';
import { Button } from '@repo/ui/button';

import { Star } from 'lucide-react';
import Image from 'next/image';
import { FaAndroid, FaApple } from 'react-icons/fa';

import DeviceMockup from '@/assets/images/mobile-cta.png';

export function Hero() {
  return (
    <section className="bg-white dark:bg-background">
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          {/* Text — animate on mount */}
          <div
            className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both"
            style={{ animationDelay: '0ms' }}
          >
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
            <div
              className="flex flex-col gap-3 pt-2 sm:flex-row animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
              style={{ animationDelay: '150ms' }}
            >
              <Button size="lg" className="h-12 px-8 gap-2">
                <FaApple className="h-5 w-5" />
                Download for iOS
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 gap-2">
                <FaAndroid className="h-4 w-4" />
                Download for Android
              </Button>
            </div>
            <div
              className="flex items-center gap-6 pt-4 animate-in fade-in duration-700 fill-mode-both"
              style={{ animationDelay: '300ms' }}
            >
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

          {/* Mockup — slide in from right */}
          <div
            className="relative mx-auto lg:ml-auto animate-in fade-in slide-in-from-right-8 duration-1000 fill-mode-both"
            style={{ animationDelay: '200ms' }}
          >
            <div className="relative z-10 overflow-hidden">
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
