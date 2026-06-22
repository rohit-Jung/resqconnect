'use client';

import {
  BarChart3,
  Globe,
  MapPin,
  Navigation,
  Radio,
  Shield,
  Smartphone,
  Zap,
} from 'lucide-react';
import type { ElementType } from 'react';

import { fadeUp } from '@/components/cta-button';
import { useInView } from '@/hooks/use-in-view';

const USER_FEATURES = [
  {
    icon: Zap,
    title: 'One-Tap SOS',
    desc: 'Alert all nearby responders with a single tap.',
  },
  {
    icon: MapPin,
    title: 'Precision Location',
    desc: 'GPS + H3 indexing pinpoints you within meters.',
  },
  {
    icon: Navigation,
    title: 'Live Tracking',
    desc: 'Real-time tracking via WebSocket.',
  },
  {
    icon: Shield,
    title: 'SMS Fallback',
    desc: 'No internet? Requests work via SMS.',
  },
];

const ORG_FEATURES = [
  {
    icon: Radio,
    title: 'Responder Management',
    desc: 'Manage your team, track availability and performance.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    desc: 'Response trends, incident volume, exportable data.',
  },
  {
    icon: Shield,
    title: 'Compliance Controls',
    desc: 'HIPAA, CJIS, MFA, session timeouts per tenant.',
  },
  {
    icon: Globe,
    title: 'Multi-Silo Architecture',
    desc: 'Each organization gets an isolated, dedicated backend.',
  },
];

function FeatureCard({
  icon: Icon,
  title,
  desc,
  inView,
  delay,
}: {
  icon: ElementType;
  title: string;
  desc: string;
  inView: boolean;
  delay: number;
}) {
  return (
    <div
      className="group bg-background p-6 transition-all duration-500 hover:-translate-y-0.5 hover:bg-secondary/30"
      style={fadeUp(inView, delay)}
    >
      <Icon className="h-4 w-4 text-primary transition-all duration-300 group-hover:scale-110 group-hover:text-primary/80" />
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {desc}
      </p>
    </div>
  );
}

export function FeaturesSection() {
  const { ref, inView } = useInView(0.1);

  return (
    <section
      id="features"
      ref={ref as React.RefObject<HTMLElement>}
      className="border-b border-border py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Built for users,{' '}
          <span className="text-primary">built for organizations.</span>
        </h2>

        <div className="mt-16">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            For individuals
          </p>
          <div className="grid gap-px border-border bg-border md:grid-cols-4">
            {USER_FEATURES.map((f, idx) => (
              <FeatureCard
                key={f.title}
                icon={f.icon}
                title={f.title}
                desc={f.desc}
                inView={inView}
                delay={idx * 80}
              />
            ))}
          </div>
        </div>

        <div className="mt-16">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            For organizations
          </p>
          <div className="grid gap-px border-border bg-border md:grid-cols-4">
            {ORG_FEATURES.map((f, idx) => (
              <FeatureCard
                key={f.title}
                icon={f.icon}
                title={f.title}
                desc={f.desc}
                inView={inView}
                delay={400 + idx * 80}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
