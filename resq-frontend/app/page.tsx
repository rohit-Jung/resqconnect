import { Navbar } from '@/components/navbar';
import { Hero } from '@/components/hero';
import { Stats } from '@/components/stats';
import { Features } from '@/components/features';
import { Process } from '@/components/process';
import { Testimonials } from '@/components/testimonials';
import { CTA } from '@/components/cta';
import { Footer } from '@/components/footer';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col font-sans">
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
