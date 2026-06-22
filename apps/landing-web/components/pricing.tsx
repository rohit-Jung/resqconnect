'use client';

import { Button } from '@repo/ui/button';

import { ArrowRight, Check } from 'lucide-react';

const PLANS = [
  {
    name: 'Starter',
    price: 'Contact us',
    desc: 'For small departments and volunteer teams.',
    features: [
      'Up to 25 responders',
      'Basic dispatch tools',
      'SMS intake',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    price: 'Contact us',
    desc: 'For active hospitals, fire departments, and police units.',
    features: [
      'Unlimited responders',
      'Real-time tracking & maps',
      'Analytics dashboard',
      'HIPAA / CJIS compliance',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Contact us',
    desc: 'For multi-station organizations and government agencies.',
    features: [
      'Multi-silo deployment',
      'Custom compliance rules',
      'Dedicated infrastructure',
      'SLA guarantees',
      '24/7 phone support',
      'On-premise option',
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="border-b border-border py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Plans for every scale
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            From volunteer teams to government agencies. Contact us for a quote
            tailored to your organization.
          </p>
        </div>

        <div className="mt-16 grid items-stretch gap-6 md:grid-cols-3">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`relative flex flex-col border bg-card transition-all duration-300 ${
                plan.highlighted
                  ? 'border-primary shadow-xl shadow-primary/10 scale-[1.05] z-10 p-10'
                  : 'border-border p-8 hover:shadow-md'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-5 py-1.5 text-[11px] font-mono uppercase tracking-wider text-primary-foreground font-semibold shadow-lg">
                  Most common
                </div>
              )}

              <p
                className={`font-mono uppercase tracking-[0.15em] text-muted-foreground ${
                  plan.highlighted ? 'text-xs' : 'text-[10px]'
                }`}
              >
                {plan.name}
              </p>
              <p
                className={`mt-1 font-bold text-foreground ${
                  plan.highlighted ? 'text-3xl' : 'text-2xl'
                }`}
              >
                {plan.price}
              </p>
              <p
                className={`mt-2 text-muted-foreground ${
                  plan.highlighted ? 'text-base' : 'text-sm'
                }`}
              >
                {plan.desc}
              </p>

              <hr
                className={`border-border ${
                  plan.highlighted ? 'my-8' : 'my-6'
                }`}
              />

              <ul className="flex-1 space-y-3">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <Check
                      className={`mt-0.5 shrink-0 text-primary ${
                        plan.highlighted ? 'h-4 w-4' : 'h-3.5 w-3.5'
                      }`}
                    />
                    <span
                      className={`text-muted-foreground ${
                        plan.highlighted ? 'text-sm' : 'text-sm'
                      }`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? 'default' : 'outline'}
                size={plan.highlighted ? 'lg' : 'default'}
                className={`w-full ${
                  plan.highlighted ? 'mt-10 h-12 text-base' : 'mt-8'
                }`}
                asChild
              >
                <a href="#contact">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
