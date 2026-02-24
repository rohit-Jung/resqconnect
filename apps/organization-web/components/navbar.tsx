'use client';

import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300 ease-in-out',
        isScrolled
          ? 'top-4 mx-auto max-w-5xl px-4'
          : 'bg-background/95 supports-backdrop-filter:bg-background/60 border-b border-border backdrop-blur'
      )}
    >
      <div
        className={cn(
          'flex h-16 items-center justify-between transition-all duration-300 max-w-7xl',
          isScrolled
            ? 'rounded-full bg-card/95 backdrop-blur-lg shadow-lg border border-border px-6'
            : 'container mx-auto px-4'
        )}
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex items-center justify-center rounded-lg p-1">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span
            className={cn(
              'text-xl font-bold tracking-tight text-foreground transition-all duration-300',
              isScrolled ? 'hidden sm:inline' : ''
            )}
          >
            ResQ <span className="text-primary">Connect</span>
          </span>
        </Link>
        <nav
          className={cn(
            'hidden items-center md:flex transition-all duration-300',
            isScrolled ? 'gap-6' : 'gap-8'
          )}
        >
          <Link
            href="#features"
            className="hover:text-primary text-sm font-medium text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="hover:text-primary text-sm font-medium text-foreground transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="#testimonials"
            className="hover:text-primary text-sm font-medium text-foreground transition-colors"
          >
            Testimonials
          </Link>
          <Link
            href="#download"
            className="hover:text-primary text-sm font-medium text-foreground transition-colors"
          >
            Download
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <Button
            variant="ghost"
            className={cn('hidden sm:inline-flex', isScrolled && 'h-9')}
            size={isScrolled ? 'sm' : 'default'}
            asChild
          >
            <Link href="/login">Sign In</Link>
          </Button>
          <Button
            size={isScrolled ? 'sm' : 'default'}
            className={cn(isScrolled && 'h-9')}
            asChild
          >
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
