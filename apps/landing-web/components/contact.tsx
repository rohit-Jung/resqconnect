'use client';

import { Button } from '@repo/ui/button';
import { Card } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';

import { Calendar, CheckCircle2, Phone } from 'lucide-react';
import { useState } from 'react';

export function ContactSection() {
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
    <section id="contact" className="border-b border-border py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Ready to bring ResQConnect{' '}
            <span className="text-primary">to your organization?</span>
          </h2>
        </div>

        <div className="mx-auto mt-16 grid gap-8 lg:max-w-5xl lg:grid-cols-2">
          <Card className="p-6 md:p-8 transition-all duration-300 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">
              Schedule a Demo
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              See ResQConnect in action. A 30-minute walkthrough with our team.
            </p>
            <Button size="lg" className="mt-6 w-full" asChild>
              <a
                href="https://calendly.com/resqconnect/demo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                Book a Demo
                <Calendar className="h-4 w-4" />
              </a>
            </Button>
            <div className="mt-6 space-y-3 border-t border-border pt-6">
              <a
                href="mailto:hello@resqconnect.com"
                className="flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <svg
                  className="h-4 w-4 shrink-0 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                hello@resqconnect.com
              </a>
              <a
                href="tel:+977123456789"
                className="flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                +977-1-23456789
              </a>
            </div>
          </Card>

          <Card className="p-6 md:p-8 transition-all duration-300 hover:shadow-md">
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
                    <Label htmlFor="name-c">Name *</Label>
                    <Input id="name-c" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-c">Email *</Label>
                    <Input id="email-c" type="email" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-c">Organization</Label>
                  <Input id="org-c" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type-c">Inquiry Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo">Book a Demo</SelectItem>
                      <SelectItem value="partner">Partnership</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message-c">Message *</Label>
                  <textarea
                    id="message-c"
                    required
                    rows={4}
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-all duration-300 focus:border-ring focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
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
  );
}
