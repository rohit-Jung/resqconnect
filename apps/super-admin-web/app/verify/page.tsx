'use client';

import Link from 'next/link';

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">
          OTP verification removed
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Super admin auth now uses email + password only.
        </p>
        <div className="mt-6">
          <Link
            href="/login"
            className="text-primary text-sm font-medium hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
