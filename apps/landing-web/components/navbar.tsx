'use client';

import { Button } from '@repo/ui/button';

import Link from 'next/link';
import { useState } from 'react';

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Organizations', href: '#organizations' },
  { label: 'Contact', href: '#contact' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <span className="text-lg font-bold tracking-tight text-foreground">
            RESQ<span className="text-primary">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="relative text-sm text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <a href="#organizations">Sign In</a>
          </Button>
          <Button size="sm" asChild>
            <a href="#contact">Book a Demo</a>
          </Button>
        </div>

        <button
          type="button"
          className="p-2 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {open ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-6 pb-6 pt-3 md:hidden">
          <nav className="flex flex-col gap-3">
            {LINKS.map(l => (
              <a
                key={l.href}
                href={l.href}
                className="py-2 text-sm text-muted-foreground"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <hr className="border-border" />
            <Button variant="ghost" size="sm" asChild className="justify-start">
              <a href="#organizations" onClick={() => setOpen(false)}>
                Sign In
              </a>
            </Button>
            <Button size="sm" asChild className="justify-start">
              <a href="#contact" onClick={() => setOpen(false)}>
                Book a Demo
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
