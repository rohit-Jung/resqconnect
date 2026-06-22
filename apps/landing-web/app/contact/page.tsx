'use client';

import { Button } from '@repo/ui/button';
import { Card } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';

import { Calendar, CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>(
    'idle'
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    await new Promise(r => setTimeout(r, 1000));
    setStatus('success');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            RESQ<span className="text-primary">.</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/security"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Security
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-border py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Contact
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Get in <span className="text-primary">touch.</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Ready to bring ResQConnect to your organization? We&apos;re here
                to help.
              </p>
            </div>

            <div className="mx-auto mt-16 grid gap-8 lg:max-w-5xl lg:grid-cols-2">
              <Card className="p-6 md:p-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <h2 className="mt-4 text-lg font-bold text-foreground">
                  Schedule a Demo
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  See ResQConnect in action. A 30-minute walkthrough with our
                  team.
                </p>
                <Button size="lg" className="mt-6 w-full" asChild>
                  <a
                    href="https://calendly.com/resqconnect/demo"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Calendar className="h-4 w-4" />
                    Book a Demo
                  </a>
                </Button>
                <div className="mt-6 space-y-3 border-t border-border pt-6">
                  <a
                    href="mailto:hello@resqconnect.com"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                    hello@resqconnect.com
                  </a>
                  <a
                    href="tel:+977123456789"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-primary" />
                    +977-1-23456789
                  </a>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    Kathmandu, Nepal
                  </div>
                </div>
              </Card>

              <Card className="p-6 md:p-8">
                {status === 'success' ? (
                  <div className="flex flex-col items-center gap-4 py-12 text-center">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                    <p className="text-sm font-semibold text-foreground">
                      Message sent.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      We&apos;ll respond within 24 hours.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatus('idle')}
                    >
                      Send another
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <p className="text-sm font-semibold text-foreground">
                      Send us a message
                    </p>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input id="name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org">Organization</Label>
                      <Input id="org" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <textarea
                        id="message"
                        required
                        rows={4}
                        className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={status === 'submitting'}
                    >
                      {status === 'submitting' ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                )}
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ResQConnect. All rights reserved.</p>
          <div className="mt-3 flex justify-center gap-6">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/security" className="hover:text-foreground">
              Security
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
