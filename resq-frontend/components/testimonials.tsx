import { Star } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

export function Testimonials() {
  const reviews = [
    {
      name: 'Sarah Mitchell',
      role: 'New York, NY',
      quote:
        'When my father had a heart attack, ResQConnect sent his location and medical history to paramedics instantly. They arrived prepared and saved his life.',
      image: '/sarah-mitchell.jpg',
    },
    {
      name: 'Marcus Johnson',
      role: 'Austin, TX',
      quote:
        'As someone with severe allergies, having my medical info instantly accessible to first responders gives me incredible peace of mind every day.',
      image: '/marcus-johnson.jpg',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Los Angeles, CA',
      quote:
        'The silent alert feature helped me get help during a dangerous situation without escalating it. This app literally saved my life.',
      image: '/emily-rodriguez.jpg',
    },
  ];

  return (
    <section id="testimonials" className="bg-background py-20 md:py-32">
      <div className="container mx-auto px-8 sm:px-12 md:px-16 lg:px-24 xl:px-32">
        <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
          <div className="text-primary inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold">
            TESTIMONIALS
          </div>
          <h2 className="text-3xl font-extrabold text-foreground md:text-5xl">
            Real Stories, Real Lives Saved
          </h2>
          <p className="text-lg text-muted-foreground">
            Hear from people who trusted ResQConnect in their moment of need
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {reviews.map((review, idx) => (
            <Card key={idx} className="border-border bg-card shadow-sm">
              <CardContent className="space-y-4 pt-8">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="leading-relaxed text-muted-foreground italic">"{review.quote}"</p>
                <div className="flex items-center gap-4 pt-4">
                  <Avatar>
                    <AvatarImage src={review.image || '/placeholder.svg'} />
                    <AvatarFallback>{review.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-card-foreground">{review.name}</h4>
                    <p className="text-xs text-muted-foreground">{review.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
