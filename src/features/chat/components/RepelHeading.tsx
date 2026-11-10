import { Fragment, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const RADIUS = 130; // 커서와 이 거리(px) 안쪽 글자만 반응
const MAX_PUSH = 44; // 최대 밀림(px)
const MAX_TILT = 20; // 최대 기울기(deg)
const STIFFNESS = 170; // 스프링 강성: 클수록 빨리 따라온다
const DAMPING = 17; // 감쇠: 살짝 출렁이며 제자리로 돌아오는 정도
const REST_DISTANCE = 0.05; // 이 오차 안이면 멈춘 것으로 본다
const REST_SPEED = 0.5;

export type RepelLine = { text: string; className?: string };

type Glyph = {
  el: HTMLElement;
  /** 변형 전 글자 중심 (제목 좌상단 기준) */
  ox: number;
  oy: number;
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  vr: number;
};

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("ko", { granularity: "grapheme" })
    : null;

// 이모지·조합 문자가 쪼개지지 않도록 사용자가 보는 글자 단위로 나눈다
function splitGraphemes(text: string): string[] {
  if (!segmenter) return Array.from(text);
  return Array.from(segmenter.segment(text), (part) => part.segment);
}

/**
 * 마우스가 가까이 오면 글자가 커서 반대쪽으로 밀려났다가 스프링처럼 돌아오는 제목.
 * - 글자 위치는 한 번만 재고(크기가 바뀔 때만 다시), 움직임이 있을 때만 프레임을 돈다
 * - 터치 입력과 '동작 줄이기' 설정에서는 가만히 있는다
 * - 스크린 리더에는 aria-label로 온전한 문장을 읽어 준다
 */
export default function RepelHeading({
  lines,
  className,
}: {
  lines: RepelLine[];
  className?: string;
}) {
  const rootRef = useRef<HTMLHeadingElement>(null);
  const label = lines.map((line) => line.text).join(" ");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: 0, y: 0, active: false };
    let glyphs: Glyph[] = [];
    let needsMeasure = true;
    let frame = 0;
    let lastTime = 0;
    let disposed = false;

    // offset* 값은 transform의 영향을 받지 않아 밀려난 상태에서도 원래 자리를 준다
    const measure = () => {
      const known = new Map(glyphs.map((glyph) => [glyph.el, glyph]));
      glyphs = Array.from(
        root.querySelectorAll<HTMLElement>("[data-repel-char]"),
        (el) => {
          const ox = el.offsetLeft + el.offsetWidth / 2;
          const oy = el.offsetTop + el.offsetHeight / 2;
          const glyph = known.get(el);
          if (glyph) {
            glyph.ox = ox;
            glyph.oy = oy;
            return glyph;
          }
          return { el, ox, oy, x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0 };
        },
      );
      needsMeasure = false;
    };

    const tick = (now: number) => {
      frame = 0;
      if (needsMeasure) measure();

      // 탭 전환 등으로 프레임이 벌어져도 스프링이 튀지 않도록 간격을 제한한다
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 1 / 30) : 1 / 60;
      lastTime = now;

      const rect = root.getBoundingClientRect();
      const mx = pointer.x - rect.left;
      const my = pointer.y - rect.top;
      const live = pointer.active && !reducedMotion.matches;
      let moving = false;

      for (const glyph of glyphs) {
        let tx = 0;
        let ty = 0;
        let tr = 0;

        if (live) {
          const dx = glyph.ox - mx;
          const dy = glyph.oy - my;
          const distance = Math.hypot(dx, dy);
          if (distance < RADIUS) {
            const falloff = (1 - distance / RADIUS) ** 2;
            const nx = distance > 0 ? dx / distance : 0;
            const ny = distance > 0 ? dy / distance : -1;
            tx = nx * MAX_PUSH * falloff;
            ty = ny * MAX_PUSH * falloff;
            tr = nx * MAX_TILT * falloff;
          }
        }

        glyph.vx += (STIFFNESS * (tx - glyph.x) - DAMPING * glyph.vx) * dt;
        glyph.vy += (STIFFNESS * (ty - glyph.y) - DAMPING * glyph.vy) * dt;
        glyph.vr += (STIFFNESS * (tr - glyph.r) - DAMPING * glyph.vr) * dt;
        glyph.x += glyph.vx * dt;
        glyph.y += glyph.vy * dt;
        glyph.r += glyph.vr * dt;

        const settled =
          Math.abs(tx - glyph.x) < REST_DISTANCE &&
          Math.abs(ty - glyph.y) < REST_DISTANCE &&
          Math.abs(tr - glyph.r) < REST_DISTANCE &&
          Math.abs(glyph.vx) < REST_SPEED &&
          Math.abs(glyph.vy) < REST_SPEED &&
          Math.abs(glyph.vr) < REST_SPEED;

        if (settled) {
          glyph.x = tx;
          glyph.y = ty;
          glyph.r = tr;
          glyph.vx = glyph.vy = glyph.vr = 0;
        } else {
          moving = true;
        }

        // 제자리에 돌아온 글자는 transform을 지워 평소와 똑같이 렌더링되게 한다
        glyph.el.style.transform =
          glyph.x === 0 && glyph.y === 0 && glyph.r === 0
            ? ""
            : `translate(${glyph.x.toFixed(2)}px, ${glyph.y.toFixed(2)}px) rotate(${glyph.r.toFixed(2)}deg)`;
      }

      if (moving) {
        frame = requestAnimationFrame(tick);
      } else {
        lastTime = 0;
      }
    };

    const wake = () => {
      if (!frame && !disposed) frame = requestAnimationFrame(tick);
    };

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      wake();
    };

    const handleLeave = () => {
      pointer.active = false;
      wake();
    };

    const handleLayoutChange = () => {
      needsMeasure = true;
      wake();
    };

    const resizeObserver = new ResizeObserver(handleLayoutChange);
    resizeObserver.observe(root);
    // 웹폰트가 늦게 적용되면 글자 폭이 달라지므로 다시 잰다
    void document.fonts?.ready.then(() => {
      if (!disposed) handleLayoutChange();
    });

    window.addEventListener("pointermove", handleMove, { passive: true });
    // 커서는 그대로인데 제목이 스크롤로 움직이는 경우
    window.addEventListener("scroll", wake, { passive: true, capture: true });
    window.addEventListener("blur", handleLeave);
    document.documentElement.addEventListener("pointerleave", handleLeave);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("scroll", wake, { capture: true });
      window.removeEventListener("blur", handleLeave);
      document.documentElement.removeEventListener("pointerleave", handleLeave);
      for (const glyph of glyphs) glyph.el.style.transform = "";
    };
    // 문구가 바뀌면(예: 로그인 이름 로드) 글자 요소가 달라지므로 다시 연결한다
  }, [label]);

  return (
    // relative: 글자의 offsetParent를 제목으로 고정해 위치 계산 기준을 맞춘다
    <h1 ref={rootRef} aria-label={label} className={cn("relative cursor-default", className)}>
      {lines.map((line, lineIndex) => (
        <span key={lineIndex} aria-hidden="true" className={cn("block", line.className)}>
          {line.text.split(" ").map((word, wordIndex) => (
            <Fragment key={wordIndex}>
              {wordIndex > 0 && " "}
              {/* 단어 단위로 묶어 줄바꿈이 글자 중간에서 일어나지 않게 한다 (break-keep 유지) */}
              <span className="inline-block whitespace-nowrap">
                {splitGraphemes(word).map((char, charIndex) => (
                  <span key={charIndex} data-repel-char="" className="inline-block">
                    {char}
                  </span>
                ))}
              </span>
            </Fragment>
          ))}
        </span>
      ))}
    </h1>
  );
}
