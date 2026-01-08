import { useState, useRef } from "react";
import "./landing.module.css";

export default function LandingPage() {
  const [isVisible] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyToClipboard = async () => {
    const code = `<script
  src="https://widget.yourdomain.com/loader.js"
  data-widget-key="YOUR_WIDGET_KEY"
></script>`;

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);

      // 기존 timeout이 있으면 클리어
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      // 2초 후 원래 상태로 복원
      copyTimeoutRef.current = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Pattern */}
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

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-32">
          <div
            className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <div className="inline-block mb-4 sm:mb-6">
              <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-50 text-[#df3326] rounded-full text-xs sm:text-sm font-medium border border-red-100">
                GIST 개발자를 위한 챗봇 위젯 SDK
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2">
              스크립트 한 줄로
              <br />
              <span className="text-[#df3326]">챗봇을 시작하세요</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-3 sm:mb-4 leading-relaxed max-w-3xl mx-auto px-2">
              iframe 기반 챗봇 위젯으로 CSS/JS 충돌 없이
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              안정적이고 강력한 고객 지원을 제공하세요
            </p>
            <p className="text-sm sm:text-base text-gray-500 mb-8 sm:mb-12 px-2">
              복잡한 설정 없이, 몇 분 안에 웹사이트에 통합할 수 있습니다
            </p>
          </div>

          {/* Code Example */}
          <div
            className={`max-w-4xl mx-auto mt-8 sm:mt-12 transition-all duration-1000 delay-300 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm mx-2 sm:mx-0">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400"></div>
                  <span className="ml-2 sm:ml-4 text-xs sm:text-sm font-medium text-gray-700">
                    설치 코드
                  </span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    isCopied
                      ? "bg-[#df3326] text-white border border-[#df3326]"
                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {isCopied ? "복사됨!" : "복사하기"}
                </button>
              </div>
              <pre className="text-left overflow-x-auto bg-gray-900 rounded-lg p-3 sm:p-4 text-xs sm:text-sm md:text-base">
                <code className="text-green-400 font-mono">
                  {`<script
  src="https://widget.yourdomain.com/loader.js"
  data-widget-key="YOUR_WIDGET_KEY"
></script>`}
                </code>
              </pre>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500 px-1">
                💡 <span className="font-medium">팁:</span> 이 코드를 웹사이트의{" "}
                <code className="px-1 py-0.5 bg-gray-200 rounded text-xs font-mono">
                  &lt;body&gt;
                </code>{" "}
                태그 하단에 추가하세요
              </p>
            </div>
          </div>
        </section>

        {/* About Chatbot Section */}
        <section className="bg-white py-12 sm:py-16 md:py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
                GIST 챗봇이란?
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-2">
                GIST의 공식 정보를 기반으로 한 지능형 챗봇입니다
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="bg-linear-to-br from-red-50 to-orange-50 border border-red-100 rounded-2xl p-6 sm:p-8 md:p-12 mb-8 sm:mb-10 md:mb-12">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-[#df3326] rounded-xl flex items-center justify-center mx-auto sm:mx-0">
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                      학교 정보를 가장 빠르게 찾아드립니다
                    </h3>
                    <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
                      GIST 챗봇은 학사 공지, 신입생 소개 자료, 학사 편람 등
                      <span className="font-semibold text-[#df3326]">
                        {" "}
                        GIST의 공식 정보를 직접 학습
                      </span>
                      한 지능형 챗봇입니다. 학교 관련 질문에 대해
                      <span className="font-semibold">
                        {" "}
                        가장 정확하고 빠른 답변
                      </span>
                      을 제공합니다.
                    </p>
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
                      <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/80 rounded-lg text-xs sm:text-sm font-medium text-gray-700 border border-red-200">
                        📋 학사 공지
                      </span>
                      <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/80 rounded-lg text-xs sm:text-sm font-medium text-gray-700 border border-red-200">
                        🎓 신입생 소개 자료
                      </span>
                      <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/80 rounded-lg text-xs sm:text-sm font-medium text-gray-700 border border-red-200">
                        📖 학사 편람
                      </span>
                      <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/80 rounded-lg text-xs sm:text-sm font-medium text-gray-700 border border-red-200">
                        🏫 학교 자체 정보
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {[
                  {
                    icon: "⚡",
                    title: "빠른 응답",
                    description:
                      "학교 공식 정보를 기반으로 하기 때문에 즉시 정확한 답변을 받을 수 있습니다.",
                  },
                  {
                    icon: "🎯",
                    title: "정확한 정보",
                    description:
                      "학사 공지와 편람 등 공식 자료를 학습하여 신뢰할 수 있는 정보만 제공합니다.",
                  },
                  {
                    icon: "💬",
                    title: "쉬운 접근",
                    description:
                      "복잡한 웹사이트 탐색 없이 간단한 질문으로 원하는 정보를 바로 찾을 수 있습니다.",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`bg-white border border-gray-200 rounded-xl p-5 sm:p-6 hover:shadow-lg transition-all duration-300 hover:border-[#df3326]/30 ${
                      isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-10"
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">
                      {item.icon}
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {item.title}
                    </h4>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 py-12 sm:py-16 md:py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
                GIST 챗봇의 핵심 특징
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
                GIST를 위해 특별히 설계된 챗봇 위젯의 핵심 특징입니다
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
              {[
                {
                  icon: "⚡",
                  title: "초간단 설치",
                  description:
                    "스크립트 한 줄만 추가하면 바로 사용할 수 있습니다. 복잡한 빌드 과정이나 설정 파일이 필요 없어요.",
                  detail: "npm 설치나 번들링 과정 없이 바로 시작하세요.",
                },
                {
                  icon: "🛡️",
                  title: "완전 분리된 구조",
                  description:
                    "iframe 기반으로 호스트 페이지와 완전히 분리되어 있어 CSS/JS 충돌 걱정이 없습니다.",
                  detail: "기존 스타일이나 스크립트에 영향을 주지 않아요.",
                },
                {
                  icon: "🎨",
                  title: "유연한 커스터마이징",
                  description:
                    "색상, 위치, 크기 등 모든 것을 data 속성으로 쉽게 커스터마이징할 수 있습니다.",
                  detail: "브랜드에 맞게 색상을 자유롭게 변경하세요.",
                },
                {
                  icon: "📡",
                  title: "강력한 JavaScript API",
                  description:
                    "위젯 상태와 메시지를 실시간으로 추적하고 제어할 수 있는 완전한 API를 제공합니다.",
                  detail: "onOpen, onMessage 등 다양한 이벤트를 감지하세요.",
                },
                {
                  icon: "🔒",
                  title: "안전한 통신",
                  description:
                    "postMessage와 origin 검증으로 안전한 통신을 보장합니다.",
                  detail: "보안을 최우선으로 설계되었습니다.",
                },
                {
                  icon: "📚",
                  title: "상세한 문서",
                  description:
                    "설치부터 커스터마이징까지 모든 것을 친절하게 안내하는 문서를 제공합니다.",
                  detail: "궁금한 점이 있으면 언제든지 확인하세요.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`bg-white border border-gray-200 rounded-xl p-5 sm:p-6 hover:shadow-lg transition-all duration-300 hover:border-[#df3326]/20 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                  }`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-2 leading-relaxed">
                    {feature.description}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {feature.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Start Guide */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-32">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              빠른 시작 가이드
            </h2>
            <p className="text-base sm:text-lg text-gray-600 px-2">
              3단계로 시작하는 간단한 가이드입니다
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
            {[
              {
                step: "1",
                title: "위젯 키 발급받기",
                description:
                  "대시보드에서 위젯 키를 발급받으세요. 각 웹사이트마다 고유한 키가 필요합니다.",
                code: null,
              },
              {
                step: "2",
                title: "스크립트 추가하기",
                description:
                  "발급받은 위젯 키를 사용해 스크립트를 웹사이트에 추가하세요.",
                code: `<script
  src="https://widget.yourdomain.com/loader.js"
  data-widget-key="YOUR_WIDGET_KEY"
></script>`,
              },
              {
                step: "3",
                title: "완료!",
                description:
                  "이제 웹사이트 우하단에 챗봇 버튼이 표시됩니다. 필요에 따라 색상이나 위치를 커스터마이징하세요.",
                code: null,
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`flex flex-col sm:flex-row gap-4 sm:gap-6 items-start p-5 sm:p-6 bg-gray-50 border border-gray-200 rounded-xl transition-all duration-500 ${
                  isVisible
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-10"
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-[#df3326] text-white rounded-full flex items-center justify-center font-bold text-base sm:text-lg mx-auto sm:mx-0">
                  {item.step}
                </div>
                <div className="flex-1 w-full sm:w-auto">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 text-center sm:text-left">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 text-center sm:text-left">
                    {item.description}
                  </p>
                  {item.code && (
                    <pre className="bg-gray-900 rounded-lg p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm">
                      <code className="text-green-400 font-mono">
                        {item.code}
                      </code>
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
            <div className="text-center text-gray-500 px-2">
              <p className="mb-2 text-sm sm:text-base">
                © 2024 Chatbot Widget. 개발자를 위한 챗봇 위젯 SDK
              </p>
              <p className="text-xs sm:text-sm text-gray-400">
                궁금한 점이 있으시면 언제든지 문의해주세요
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
