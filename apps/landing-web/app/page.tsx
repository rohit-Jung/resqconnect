import { ContactSection } from '@/components/contact';
import { FeaturesSection } from '@/components/features';
import { FooterSection } from '@/components/footer';
import { HeroSection } from '@/components/hero';
import { HowItWorksSection } from '@/components/how-it-works';
import { Navbar } from '@/components/navbar';
import { OrganizationsSection } from '@/components/organizations';
import { PricingSection } from '@/components/pricing';
import { ProblemSection } from '@/components/problem-section';
import { TestimonialsSection } from '@/components/testimonials';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <PricingSection />
        <OrganizationsSection />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <FooterSection />
    </div>
  );
}
