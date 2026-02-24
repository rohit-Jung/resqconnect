import { CTA } from '@/components/cta';
import { Features } from '@/components/features';
import { Footer } from '@/components/footer';
import { Hero } from '@/components/hero';
import { Navbar } from '@/components/navbar';
import { Process } from '@/components/process';
import { Stats } from '@/components/stats';
import { Testimonials } from '@/components/testimonials';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col font-sans bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Stats />
        <Features />
        <Process />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
