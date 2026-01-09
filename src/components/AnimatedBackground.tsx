export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated Gradient Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(223, 51, 38, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255, 152, 0, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(223, 51, 38, 0.05) 0%, transparent 50%)
          `,
          animation: "gradientShift 20s ease infinite",
        }}
      />

      {/* Static Grid Pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(90deg, transparent 78px, rgba(223, 51, 38, 0.06) 80px, rgba(223, 51, 38, 0.06) 82px, transparent 84px),
            linear-gradient(0deg, transparent 78px, rgba(223, 51, 38, 0.06) 80px, rgba(223, 51, 38, 0.06) 82px, transparent 84px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Floating Gradient Orbs */}
      <div
        className="absolute top-1/4 -left-1/4 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(223, 51, 38, 0.12) 0%, transparent 70%)",
          animation: "orbFloat1 25s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-1/4 -right-1/4 w-[350px] h-[350px] sm:w-[450px] sm:h-[450px] md:w-[600px] md:h-[600px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255, 152, 0, 0.1) 0%, transparent 70%)",
          animation: "orbFloat2 30s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(223, 51, 38, 0.08) 0%, transparent 70%)",
          animation: "orbFloat3 20s ease-in-out infinite",
        }}
      />

      {/* Moving Diagonal Lines Pattern - 빠르게 움직이는 대각선 */}
      <div
        className="absolute"
        style={{
          inset: "-40px",
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(223, 51, 38, 0.06) 10px,
              rgba(223, 51, 38, 0.06) 11px
            )
          `,
          backgroundSize: "40px 40px",
          animation: "lineMove 2.7s linear infinite",
        }}
      />

      {/* Pulsing Color Overlay - 더 연한 펄스 효과 */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(
            ellipse 110% 70% at 50% 40%,
            rgba(223, 51, 38, 0.08) 0%,
            rgba(223, 51, 38, 0.05) 35%,
            transparent 65%
          )`,
          animation: "pulseColor 5s ease-in-out infinite",
        }}
      />
    </div>
  );
}

