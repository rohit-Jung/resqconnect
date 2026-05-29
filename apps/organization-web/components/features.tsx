'use client';

import {
  AlertTriangle,
  CreditCard,
  MapPin,
  Navigation,
  Radio,
  Users,
} from 'lucide-react';

import { useInView } from '@/hooks/use-in-view';

const features = [
  {
    title: 'One-Tap Emergency',
    description:
      'Instantly alert emergency services and your safety network with a single tap. No navigation, no delays.',
    icon: AlertTriangle,
  },
  {
    title: 'Real-Time Location',
    description:
      'Automatic GPS sharing sends your exact location to responders and trusted contacts instantly.',
    icon: MapPin,
  },
  {
    title: 'Organization Dashboard',
    description:
      'Manage responders, track analytics, monitor responses, and oversee operations from a single dashboard.',
    icon: Radio,
  },
  {
    title: 'Live Responder Tracking',
    description:
      'Track the real-time location of all emergency response teams on an interactive map.',
    icon: Navigation,
  },
  {
    title: 'Offline SMS Requests',
    description:
      'Request emergency help even without internet via SMS fallback. Your request reaches responders regardless of connectivity.',
    icon: Users,
  },
  {
    title: 'Subscription Plans',
    description:
      'Flexible Khalti-powered subscription plans for organizations to unlock premium features and analytics.',
    icon: CreditCard,
  },
];

export function Features() {
  const { ref: headingRef, inView: headingVisible } = useInView(0.2);
  const { ref: gridRef, inView: gridVisible } = useInView(0.1);

  return (
    <section id="features" className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div
          ref={headingRef as React.RefObject<HTMLDivElement>}
          className="mb-12 transition-all duration-700"
          style={{
            opacity: headingVisible ? 1 : 0,
            transform: headingVisible ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            FEATURES
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Everything You Need
          </h2>
        </div>

        <div
          ref={gridRef as React.RefObject<HTMLDivElement>}
          className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-background p-6 transition-all duration-500"
              style={{
                transitionDelay: `${idx * 80}ms`,
                opacity: gridVisible ? 1 : 0,
                transform: gridVisible ? 'translateY(0)' : 'translateY(32px)',
              }}
            >
              <feature.icon className="mb-4 h-5 w-5 text-primary" />
              <h3 className="mb-2 text-base font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
