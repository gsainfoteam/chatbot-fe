import { useRef, useEffect, Children } from "react";

const LERP = 0.06; // 글로우 부드러운 추적

export default function HeroMouseInteraction({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const targetGlow = useRef({ x: 50, y: 50 });
  const currentGlow = useRef({ x: 50, y: 50 });
  const rafId = useRef<number>(0);

  useEffect(() => {
    const section = sectionRef.current;
    const glowEl = glowRef.current;
    if (!section) return;

    const handleMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      targetGlow.current = { x, y };
    };

    const tick = () => {
      const tg = targetGlow.current;
      const cg = currentGlow.current;

      cg.x += (tg.x - cg.x) * LERP;
      cg.y += (tg.y - cg.y) * LERP;

      if (glowEl) {
        glowEl.style.left = `${cg.x}%`;
        glowEl.style.top = `${cg.y}%`;
      }
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    window.addEventListener("mousemove", handleMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <section ref={sectionRef} className={`relative ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          ref={glowRef}
          className="hero-cursor-glow absolute rounded-full blur-3xl opacity-70"
          style={{
            left: "50%",
            top: "50%",
            width: "min(80vw, 600px)",
            height: "min(80vw, 600px)",
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(223, 51, 38, 0.25) 0%, rgba(255, 152, 0, 0.12) 40%, transparent 65%)",
          }}
        />
      </div>

      <div className="relative z-10">
        {Children.toArray(children)[0]}
        {Children.toArray(children).slice(1)}
      </div>
    </section>
  );
}
