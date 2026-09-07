// TODO: Upstage 파트너십 확정 시 UpstageLogoIcon import 및 아래 주석 항목 복원
import { GistMediaMarkIcon, LetsurLogoIcon } from "@/components/Icons";

const partners = [
  {
    name: "Letsur",
    role: "Technology Partner",
    href: "https://letsur.ai",
    domain: "letsur.ai",
    logo: (
      <LetsurLogoIcon className="h-[18px] w-auto text-slate-400 transition-colors duration-300 group-hover:text-slate-500 sm:h-[22px]" />
    ),
  },
  {
    name: "광주과학기술원",
    role: "Sponsored by",
    href: "https://www.gist.ac.kr",
    domain: "gist.ac.kr",
    logo: (
      <GistMediaMarkIcon className="h-[22px] w-auto text-slate-400 transition-colors duration-300 group-hover:text-slate-500 sm:h-[26px]" />
    ),
  },
  // Upstage 파트너십 미확정 — 확정 전까지 주석 처리
  // {
  //   name: "Upstage",
  //   role: "Technology Partner",
  //   href: "https://www.upstage.ai",
  //   domain: "upstage.ai",
  //   logo: (
  //     <UpstageLogoIcon className="h-7 w-auto text-slate-400 transition-colors duration-300 group-hover:text-slate-500 sm:h-8" />
  //   ),
  // },
];

const letsurTags = ["AI Gateway 인프라", "모델 라우팅"];

const sponsorCards = [
  // Upstage 파트너십 미확정 — 확정 전까지 주석 처리
  // {
  //   name: "Upstage",
  //   role: "Technology Partner",
  //   href: "https://www.upstage.ai",
  //   domain: "upstage.ai",
  //   ariaLabel: "Upstage 웹사이트로 이동",
  //   logo: <UpstageLogoIcon className="h-6 w-auto text-gray-500 sm:h-7" />,
  //   description: "Solar LLM 지원으로 챗봇의 한국어 이해 품질을 끌어올립니다.",
  //   tags: ["Solar LLM", "API 지원"],
  // },
  {
    name: "GIST 학생팀",
    role: "Sponsor",
    href: "https://ewww.gist.ac.kr/",
    domain: "gist.ac.kr",
    ariaLabel: "GIST 소개 페이지로 이동",
    logo: <GistMediaMarkIcon className="h-5 w-auto text-gray-500 sm:h-6" />,
    description:
      "서버 인프라부터 학내 홍보까지, GIST의 지원 위에서 서비스가 운영됩니다. 학생들이 믿고 쓸 수 있는 정보 서비스를 학교와 함께 만들어갑니다.",
    tags: ["서버 인프라", "홍보 활동", "학내 협력"],
  },
];

function ArrowIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 8l4 4m0 0l-4 4m4-4H3"
      />
    </svg>
  );
}

// 마퀴 한 세트: 파트너 목록을 여러 번 반복해 트랙을 채운다
function MarqueeGroup({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul
      aria-hidden={ariaHidden}
      className="flex shrink-0 items-center gap-16 pr-16 sm:gap-24 sm:pr-24"
    >
      {Array.from({ length: 3 }).flatMap((_, setIndex) =>
        partners.map((partner) => (
          <li key={`${setIndex}-${partner.name}`}>
            <a
              href={partner.href}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={ariaHidden ? -1 : undefined}
              aria-label={`${partner.name} 웹사이트로 이동`}
              className="group flex flex-col items-center gap-2 transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400 transition-colors duration-300 group-hover:text-[#df3326]">
                {partner.role}
              </span>
              <span className="flex h-7 items-center sm:h-8">
                {partner.logo}
              </span>
              <span className="flex h-4 items-center gap-1 text-xs text-gray-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {partner.domain}
                <ArrowIcon className="h-3 w-3" />
              </span>
            </a>
          </li>
        )),
      )}
    </ul>
  );
}

export default function PartnersSection() {
  return (
    <>
      {/* 파트너 마퀴 */}
      <section className="bg-white pt-6 pb-12 sm:pt-8 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="h-px flex-1 bg-gray-200" />
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gray-400 sm:text-sm">
              With Our Partners
            </p>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="partners-marquee relative mt-8 overflow-hidden sm:mt-10">
            {/* 좌우 페이드 */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-white to-transparent sm:w-24" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-white to-transparent sm:w-24" />

            <div className="partners-marquee-track flex w-max">
              <MarqueeGroup />
              <MarqueeGroup ariaHidden />
            </div>
          </div>
        </div>
      </section>

      {/* 파트너 쇼케이스 */}
      <section className="relative overflow-hidden border-y border-red-100/70 bg-linear-to-b from-orange-50/60 via-white to-red-50/60 py-12 sm:py-16 md:py-20 lg:py-32">
        {/* 히어로(격자·대각선)와 구분되는 이 섹션만의 질감: 가장자리로 갈수록 옅어지는 점 패턴 + 은은한 글로우 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(223,51,38,0.18)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_85%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-48 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-orange-100/70 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -bottom-56 h-[420px] w-[420px] rounded-full bg-red-100/60 blur-3xl"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              GIST 챗봇과 함께하는 파트너
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-2">
              기술 파트너와 학교 측의 지원으로 더 나은 챗봇 경험을 제공합니다
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid gap-4 sm:gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            {/* 1단계: Letsur — 유일한 다크 카드로 가장 강하게 */}
            <div className="relative flex flex-col overflow-hidden rounded-2xl bg-linear-to-br from-gray-900 to-[#0a1d2f] p-6 sm:p-8">
              {/* Letsur 그린 글로우로 깊이감 */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#00c781]/25 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-[#00c781]/10 blur-3xl"
              />

              <div className="relative flex flex-1 flex-col">
                <span className="self-start rounded-full bg-[#00c781]/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#00c781]">
                  Technology Partner
                </span>

                <LetsurLogoIcon className="mt-6 h-6 w-auto self-start text-white sm:h-7" />

                <p className="mt-5 text-lg font-bold text-white sm:text-xl">
                  Powered by Letsur AI Gateway
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  GIST 챗봇의 모든 답변은 Letsur AI Gateway를 통해 생성됩니다.
                  모델 라우팅부터 응답 안정성까지, 챗봇의 기술 기반 전체를
                  Letsur가 함께합니다.
                </p>

                <div className="mt-5 mb-8 flex flex-wrap gap-2">
                  {letsurTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <a
                  href="https://letsur.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-1.5 self-start rounded-full bg-[#00c781] px-4 py-2 text-xs font-semibold text-[#0a1d2f] transition-colors hover:bg-[#00ab7f] sm:text-sm"
                >
                  letsur.ai
                  <ArrowIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* 2단계: 스폰서 카드 — 다른 섹션 카드와 같은 흰색/회색 테두리 */}
            <div className="flex flex-col gap-4 sm:gap-6">
              <div
                className={`grid flex-1 gap-4 sm:gap-6 ${
                  sponsorCards.length > 1 ? "sm:grid-cols-2" : ""
                }`}
              >
                {sponsorCards.map((card) => (
                  <div
                    key={card.name}
                    className="flex flex-col items-start rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all duration-300 hover:border-[#df3326]/30 hover:shadow-lg sm:p-6"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                      {card.role}
                    </span>
                    <span className="mt-5 flex h-7 items-center">
                      {card.logo}
                    </span>
                    <p className="mt-4 text-sm leading-relaxed text-gray-600">
                      {card.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <a
                      href={card.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={card.ariaLabel}
                      className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium text-gray-700 transition-colors hover:text-[#df3326]"
                    >
                      {card.domain}
                      <ArrowIcon className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>

              {/* 3단계: 파트너 문의 — 가장 낮은 톤, 링크만 브랜드 레드 */}
              <a
                href="mailto:chatbot@gistory.me?subject=GIST 챗봇 파트너 문의"
                className="group flex flex-col justify-center gap-1 rounded-2xl border border-dashed border-red-200 bg-white/50 p-5 transition-colors duration-300 hover:border-[#df3326]/50 hover:bg-white/80 sm:p-6"
              >
                <p className="text-sm font-semibold text-gray-900 sm:text-base">
                  GIST 챗봇의 파트너가 되고 싶으신가요?
                </p>
                <p className="text-sm text-gray-500">
                  기술 후원, 인프라 지원, 협업 제안 모두 환영합니다.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#df3326]">
                  chatbot@gistory.me
                  <ArrowIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
