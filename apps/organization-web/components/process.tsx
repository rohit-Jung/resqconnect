export function Process() {
  const steps = [
    {
      number: '1',
      title: 'Download App',
      description: 'Get ResQConnect from App Store or Google Play in seconds',
    },
    {
      number: '2',
      title: 'Setup Profile',
      description: 'Add your medical info and emergency contacts quickly',
    },
    {
      number: '3',
      title: 'Build Network',
      description: 'Invite trusted contacts to your safety circle',
    },
    {
      number: '4',
      title: 'Stay Protected',
      description: "You're ready! Help is just one tap away, anytime",
    },
  ];

  return (
    <section id="how-it-works" className="bg-secondary py-20 md:py-32">
      <div className="container mx-auto px-8 sm:px-12 md:px-16 lg:px-24 xl:px-32">
        <div className="mx-auto mb-20 max-w-3xl space-y-4 text-center">
          <div className="text-primary inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold">
            HOW IT WORKS
          </div>
          <h2 className="text-3xl font-extrabold text-foreground md:text-5xl">
            Simple Steps to Stay Safe
          </h2>
          <p className="text-lg text-muted-foreground">
            Getting started with ResQConnect is quick and easy
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl">
          {/* Connecting Line */}
          <div className="bg-primary/20 absolute top-10 right-[10%] left-[10%] hidden h-0.5 md:block" />

          <div className="grid gap-12 md:grid-cols-4">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="relative flex flex-col items-center gap-4 text-center"
              >
                <div className="bg-primary z-10 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-primary-foreground shadow-lg ring-8 ring-secondary">
                  {step.number}
                </div>
                <h3 className="mt-2 text-xl font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
