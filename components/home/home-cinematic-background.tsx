"use client";

/** Jurilu 风格：粉紫 + 深蓝流动渐变 */
export function HomeCinematicBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#0c0a12]" />
      <div className="home-gradient-flow absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1028]/30 via-transparent to-[#0a0f1e]/80" />

      <div className="home-orb home-orb-1 absolute -left-[5%] top-[5%] h-[380px] w-[380px] rounded-full bg-fuchsia-600/25 blur-[100px]" />
      <div className="home-orb home-orb-2 absolute right-[-8%] top-[20%] h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-[110px]" />
      <div className="home-orb home-orb-3 absolute bottom-[5%] left-[20%] h-[360px] w-[360px] rounded-full bg-indigo-700/25 blur-[95px]" />
      <div className="home-orb absolute right-[15%] bottom-[15%] h-[280px] w-[280px] rounded-full bg-pink-500/15 blur-[80px] [animation-delay:-6s]" />
    </div>
  );
}
