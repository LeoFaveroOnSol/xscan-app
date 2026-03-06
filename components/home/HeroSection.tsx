'use client';

export default function HeroSection() {
  return (
    <section className="relative pt-8 pb-12">
      {/* Gradient accent line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* Content */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
          Track the best memecoin{' '}
          <span className="text-primary">callers</span>.
        </h1>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mt-2">
          Love <span className="text-primary">KOLs</span> once again.
        </h2>
      </div>
    </section>
  );
}
