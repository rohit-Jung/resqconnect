import {
  BellOff,
  ClipboardList,
  MapPin,
  Users,
  Video,
  Zap,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Features() {
  const features = [
    {
      title: 'One-Tap Emergency',
      description:
        'Instantly alert emergency services and your safety network with a single tap. No navigation, no delays.',
      icon: Zap,
    },
    {
      title: 'Real-Time Location',
      description:
        'Automatic GPS sharing sends your exact location to responders and trusted contacts instantly.',
      icon: MapPin,
    },
    {
      title: 'Safety Network',
      description:
        'Create a circle of trusted contacts who are automatically notified during emergencies.',
      icon: Users,
    },
    {
      title: 'Live Video Stream',
      description:
        'Stream live video to emergency responders to help them assess the situation before arrival.',
      icon: Video,
    },
    {
      title: 'Medical Profile',
      description:
        'Store critical medical information, allergies, and medications accessible to first responders.',
      icon: ClipboardList,
    },
    {
      title: 'Silent Alert Mode',
      description:
        'Discreetly send alerts without sound or notification in dangerous situations.',
      icon: BellOff,
    },
  ];

  return (
    <section id="features" className="bg-background py-20 md:py-32">
      <div className="container mx-auto px-8 sm:px-12 md:px-16 lg:px-24 xl:px-32">
        <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
          <div className="text-primary inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold">
            FEATURES
          </div>
          <h2 className="text-3xl font-extrabold text-foreground md:text-5xl">
            Everything You Need in an Emergency
          </h2>
          <p className="text-lg text-muted-foreground">
            Comprehensive emergency response features designed to keep you and
            your loved ones safe
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <Card
              key={idx}
              className="border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="bg-primary mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold text-card-foreground">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
