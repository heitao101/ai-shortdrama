"use client";

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${8 + ((i * 17) % 84)}%`,
  top: `${12 + ((i * 23) % 76)}%`,
  size: 2 + (i % 3),
  delay: `${(i * 0.7) % 8}s`,
  duration: `${6 + (i % 5)}s`,
}));

/** Hero-only floating particles (CSS only, GPU-friendly) */
export function HeroParticles() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className="home-particle absolute rounded-full bg-white/30"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}
