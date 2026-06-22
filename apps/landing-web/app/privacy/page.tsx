import Link from 'next/link';

export default function PrivacyPage() {
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
          Privacy <span className="text-primary">Policy.</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="mt-12 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              1. Information We Collect
            </h2>
            <p className="mt-2">
              We collect information necessary to provide emergency response
              services: name, phone number, email address, GPS location, medical
              profile information (allergies, blood type, conditions), and
              emergency contacts. Organizations provide business information and
              responder details.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              2. How We Use Your Information
            </h2>
            <p className="mt-2">
              Your information is used exclusively for: dispatching emergency
              responders, sharing relevant medical information with responders
              during an incident, notifying emergency contacts, and improving
              our service. We never sell your data.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              3. Data Protection
            </h2>
            <p className="mt-2">
              All data is encrypted at rest (AES-256) and in transit (TLS 1.3).
              Each organization&apos;s data is stored in an isolated database
              silo. Access is controlled through role-based permissions and MFA.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              4. Data Retention
            </h2>
            <p className="mt-2">
              Incident data is retained per organizational compliance
              requirements (typically 2-7 years). Medical profiles are retained
              until the user requests deletion. You can request data deletion at
              any time.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              5. Your Rights
            </h2>
            <p className="mt-2">
              You have the right to access, correct, or delete your data.
              Contact us at privacy@resqconnect.com for requests. We respond
              within 30 days.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              6. Contact
            </h2>
            <p className="mt-2">
              For privacy-related inquiries:{' '}
              <a
                href="mailto:privacy@resqconnect.com"
                className="text-primary underline underline-offset-2"
              >
                privacy@resqconnect.com
              </a>{' '}
              or visit our{' '}
              <Link
                href="/contact"
                className="text-primary underline underline-offset-2"
              >
                contact page
              </Link>
              .
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ResQConnect. All rights reserved.</p>
          <div className="mt-3 flex justify-center gap-6">
            <Link href="/terms" className="hover:text-foreground">
              Terms
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
