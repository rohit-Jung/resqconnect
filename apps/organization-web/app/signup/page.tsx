import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Organization signup</h1>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        Organizations can&apos;t self-register in this deployment. Please
        contact a platform administrator to provision your organization.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium"
        >
          Go to sign in
        </Link>
        <Link
          href="/"
          className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
