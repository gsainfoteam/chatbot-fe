import { useRef, useEffect } from "react";

const RADIUS = 140; // 커서와 이 거리 안쪽일 때만 글자 반응
const MAX_DISPLACE = 60; // 최대 밀림(px)
const MAX_ROTATE = 36; // 최대 회전(deg) - 뒤틀림 느낌
const LERP = 0.14;

type Displacement = { x: number; y: number; r: number };

export default function WarpedText({
  line1,
  line2,
  line2ClassName = "",
  className = "",
}: {
  line1: string;
  line2?: string;
  line2ClassName?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const spanRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const mouse = useRef({ x: 0, y: 0 });
  const current = useRef<Displacement[]>([]);
  const rafId = useRef<number>(0);

  const chars1 = line1 ? [...line1] : [];
  const chars2 = line2 ? [...line2] : [];
  const totalChars = chars1.length + chars2.length;

  useEffect(() => {
    current.current = Array.from({ length: totalChars }, () => ({
      x: 0,
      y: 0,
      r: 0,
    }));
  }, [totalChars]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const tick = () => {
      const spans = spanRefs.current;
      const cur = current.current;
      const mx = mouse.current.x;
      const my = mouse.current.y;

      for (let i = 0; i < spans.length; i++) {
        const el = spans[i];
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const dx = cx - mx;
        const dy = cy - my;
        const dist = Math.hypot(dx, dy);

        let targetX = 0;
        let targetY = 0;
        let targetR = 0;

        if (dist < RADIUS && dist > 0) {
          const t = 1 - dist / RADIUS;
          const strength = t * t; // 이차 곡선으로 부드럽게
          const mag = MAX_DISPLACE * strength;
          const nx = dx / dist;
          const ny = dy / dist;
          targetX = nx * mag;
          targetY = ny * mag;
          targetR = (nx * 0.5 + ny * 0.5) * MAX_ROTATE * strength;
        }

        const c = cur[i];
        c.x += (targetX - c.x) * LERP;
        c.y += (targetY - c.y) * LERP;
        c.r += (targetR - c.r) * LERP;

        el.style.transform = `translate(${c.x}px, ${c.y}px) rotate(${c.r}deg)`;
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    window.addEventListener("mousemove", handleMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(rafId.current);
    };
  }, [totalChars]);

  return (
    <h1
      ref={containerRef}
      className={`${className} leading-tight`}
      style={{ display: "inline-block" }}
    >
      {chars1.map((char, i) => (
        <span
          key={`1-${i}`}
          ref={(el) => {
            spanRefs.current[i] = el;
          }}
          className="inline-block"
          style={{ transition: "none" }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
      {chars1.length > 0 && chars2.length > 0 && <br />}
      {chars2.map((char, i) => (
        <span
          key={`2-${i}`}
          ref={(el) => {
            spanRefs.current[chars1.length + i] = el;
          }}
          className={`inline-block ${line2ClassName}`}
          style={{ transition: "none" }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </h1>
  );
}
