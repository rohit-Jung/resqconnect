import { Button } from '@repo/ui/button';

import {
  ArrowRight,
  Eye,
  FileText,
  Key,
  Lock,
  Server,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

export default function SecurityPage() {
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
              href="/contact"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Contact
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-border py-24 md:py-32">
          <div className="mx-auto max-w-3xl px-6">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Security
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Your data is <span className="text-primary">protected.</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              ResQConnect is built with security and compliance at every layer —
              from encryption to access control.
            </p>
          </div>
        </section>

        <section className="border-b border-border py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Lock,
                  title: 'Encryption at Rest & in Transit',
                  desc: 'All data encrypted with AES-256 at rest and TLS 1.3 in transit. Your data is never readable without authorization.',
                },
                {
                  icon: Key,
                  title: 'Access Control',
                  desc: 'Role-based access control (RBAC) with per-tenant isolation. MFA enforced for regulated sectors.',
                },
                {
                  icon: Server,
                  title: 'Per-Tenant Isolation',
                  desc: 'Each organization operates in its own silo with a dedicated database. No cross-tenant data leakage.',
                },
                {
                  icon: FileText,
                  title: 'Audit Logging',
                  desc: 'Every action is logged with actor, timestamp, and context. Immutable audit trails for compliance review.',
                },
                {
                  icon: Eye,
                  title: 'PHI / PII Masking',
                  desc: 'Protected health information and personally identifiable data are masked in logs and non-essential contexts.',
                },
                {
                  icon: Shield,
                  title: 'Compliance Ready',
                  desc: 'HIPAA for medical, CJIS for police, session timeouts, and failed-login lockout policies per tenant.',
                },
              ].map(item => (
                <div
                  key={item.title}
                  className="border border-border bg-card p-6"
                >
                  <item.icon className="h-5 w-5 text-primary" />
                  <h2 className="mt-4 text-base font-semibold text-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Questions about security?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Our team can walk you through our security architecture and
              compliance certifications.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/contact">
                  Contact Us <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="mailto:security@resqconnect.com">
                  security@resqconnect.com
                </a>
              </Button>
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
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
