import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
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

      <main className="mx-auto max-w-3xl px-6 py-24">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
          Legal
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Terms of <span className="text-primary">Service.</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="mt-12 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              1. Acceptance of Terms
            </h2>
            <p className="mt-2">
              By using ResQConnect, you agree to these terms. If you are using
              the service on behalf of an organization, you represent that you
              have authority to bind that organization.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              2. Service Description
            </h2>
            <p className="mt-2">
              ResQConnect provides an emergency response coordination platform
              connecting individuals in distress with emergency responders. The
              service includes mobile apps for users and responders, web
              dashboards for organizations, and backend infrastructure.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              3. User Responsibilities
            </h2>
            <p className="mt-2">
              Users must provide accurate information, including GPS location
              and medical details. Misuse of the emergency system — including
              false alerts — is strictly prohibited and may result in
              termination.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              4. Service Availability
            </h2>
            <p className="mt-2">
              We strive for 99.9% uptime but do not guarantee uninterrupted
              service. Emergency response depends on factors beyond our control,
              including network availability and responder proximity.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              5. Limitation of Liability
            </h2>
            <p className="mt-2">
              ResQConnect is a coordination platform. We are not an emergency
              service provider. We are not liable for outcomes resulting from
              responder availability, response times, or user-provided
              information.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              6. Termination
            </h2>
            <p className="mt-2">
              Either party may terminate the service agreement with 30 days
              notice. We may suspend access for violations of these terms. Data
              will be exported upon request at termination.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              7. Contact
            </h2>
            <p className="mt-2">
              For questions about these terms:{' '}
              <a
                href="mailto:legal@resqconnect.com"
                className="text-primary underline underline-offset-2"
              >
                legal@resqconnect.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ResQConnect. All rights reserved.</p>
          <div className="mt-3 flex justify-center gap-6">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/security" className="hover:text-foreground">
              Security
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
