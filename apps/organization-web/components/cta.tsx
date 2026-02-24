import { Apple, Lock, Play, Shield } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import User from '@/assets/images/user.png';
import { Button } from '@/components/ui/button';

export function CTA() {
  return (
    <section id="download" className="py-20 md:py-32 bg-secondary">
      <div className="container mx-auto px-8 sm:px-12 md:px-16 lg:px-24 xl:px-32">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-primary px-8 py-16 md:px-16 md:py-24 text-primary-foreground shadow-2xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                Ready to Feel Safer?
              </h2>
              <p className="text-xl text-primary-foreground/90 leading-relaxed max-w-lg">
                Join thousands who trust ResQConnect to keep them and their
                loved ones safe. Download now and get peace of mind in your
                pocket.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-14 px-8 text-base bg-background text-foreground hover:bg-background/90"
                  asChild
                >
                  <Link href="/signup">
                    <Apple className="mr-2 h-5 w-5" /> App Store
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-base border-primary-foreground/30 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20 hover:text-primary-foreground"
                  asChild
                >
                  <Link href="/signup">
                    <Play className="mr-2 h-5 w-5 fill-current" /> Google Play
                  </Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Bank-Level Security
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  <span className="text-sm font-medium">HIPAA Compliant</span>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="relative">
                <Image
                  src={User}
                  alt="ResQConnect Mobile App"
                  className="h-auto drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
