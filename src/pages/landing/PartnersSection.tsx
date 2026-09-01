import AnimatedBackground from "@/components/AnimatedBackground";
import { GistMediaMarkIcon, UpstageLogoIcon } from "@/components/Icons";

const partners = [
  {
    name: "Letsur",
    role: "Technology Partner",
    href: "https://letsur.ai",
    domain: "letsur.ai",
    logo: (
      <img
        src="/letsur-logo.svg"
        alt="Letsur"
        className="h-[18px] w-auto object-contain transition-all duration-300 group-hover:brightness-75 sm:h-[22px]"
      />
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
  {
    name: "Upstage",
    role: "Technology Partner",
    href: "https://www.upstage.ai",
    domain: "upstage.ai",
    logo: (
      <UpstageLogoIcon className="h-7 w-auto text-slate-400 transition-colors duration-300 group-hover:text-slate-500 sm:h-8" />
    ),
  },
];

const letsurTags = ["AI Gateway 인프라", "모델 라우팅", "기술 자문"];

const sponsorCards = [
  {
    name: "Upstage",
    role: "Technology Partner",
    href: "https://www.upstage.ai",
    domain: "upstage.ai",
    ariaLabel: "Upstage 웹사이트로 이동",
    logo: <UpstageLogoIcon className="h-7 w-auto text-slate-500 sm:h-8" />,
    description:
      "Solar LLM 지원으로 챗봇의 한국어 이해 품질을 함께 끌어올립니다.",
    tags: ["Solar LLM", "API 지원"],
  },
  {
    name: "GIST 학생팀",
    role: "Sponsor",
    href: "https://introduce.gistory.me/",
    domain: "introduce.gistory.me",
    ariaLabel: "인포팀 소개 페이지로 이동",
    logo: <GistMediaMarkIcon className="h-6 w-auto text-slate-500 sm:h-7" />,
    description:
      "기획부터 운영까지, GIST 재학생들이 직접 만들어가는 프로젝트입니다.",
    tags: ["기획", "개발", "운영"],
  },
];

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
                <svg
                  className="h-3 w-3"
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
      <section className="relative overflow-hidden bg-[#faeee3] py-12 sm:py-16">
        <AnimatedBackground />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl mb-3 sm:mb-4">
            GIST 챗봇은 이런 파트너들과 만들어집니다
          </h2>
          <p className="text-center text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-2">
            기술 파트너와 학교 측의 지원으로 더 나은 챗봇 경험을 목표로 합니다
          </p>

          <div className="mt-10 grid gap-5 sm:mt-12 sm:gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            {/* Letsur 대형 다크 카드 */}
            <div className="flex flex-col rounded-3xl bg-linear-to-br from-[#0b1220] to-[#1a2540] p-8 sm:p-10">
              <span className="self-start rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-300 sm:text-xs">
                Technology Partner
              </span>

              <img
                src="/letsur-logo.svg"
                alt="Letsur"
                className="mt-8 h-8 w-auto self-start object-contain brightness-0 invert sm:mt-10 sm:h-9"
              />

              <p className="mt-8 text-lg font-bold text-white sm:mt-10 sm:text-2xl">
                Powered by Letsur AI Gateway
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
                GIST 챗봇의 모든 답변은 Letsur AI Gateway를 통해 생성됩니다.
                모델 라우팅부터 응답 안정성까지, 챗봇의 기술 기반 전체를
                Letsur가 함께합니다.
              </p>

              <div className="mt-6 border-t border-dashed border-white/20" />

              <div className="mt-6 mb-8 flex flex-wrap gap-2.5">
                {letsurTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-200 sm:text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <a
                href="https://letsur.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                letsur.ai
                <svg
                  className="h-4 w-4"
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
              </a>
            </div>

            {/* 우측: 스폰서 카드 2개 + 파트너 문의 */}
            <div className="flex flex-col gap-4 sm:gap-5">
              <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
                {sponsorCards.map((card) => (
                  <div
                    key={card.name}
                    className="flex flex-col items-start rounded-3xl bg-white p-6 text-left shadow-sm sm:p-7"
                  >
                    <span className="rounded-full bg-orange-500/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500 sm:text-xs">
                      {card.role}
                    </span>
                    <span className="mt-6 flex h-8 items-center sm:h-9">
                      {card.logo}
                    </span>
                    <p className="mt-4 text-sm leading-relaxed text-slate-500">
                      {card.description}
                    </p>
                    <div className="mt-5 w-full border-t border-dashed border-slate-400" />
                    <div className="mt-4 flex flex-wrap gap-2">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500"
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
                      className="mt-5 inline-flex items-center gap-1.5 self-start rounded-full bg-[#0b1220] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1a2540]"
                    >
                      {card.domain}
                      <svg
                        className="h-3.5 w-3.5"
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
                    </a>
                  </div>
                ))}
              </div>

              <a
                href="mailto:chatbot@gistory.me?subject=GIST 챗봇 파트너 문의"
                className="group flex flex-1 flex-col items-start justify-center gap-4 rounded-3xl border-2 border-dashed border-[#df3326]/30 bg-white/40 p-6 transition-colors duration-300 hover:border-[#df3326]/60 sm:p-7"
              >
                <div>
                  <p className="text-base font-bold text-gray-900 sm:text-lg">
                    GIST 챗봇의 파트너가 되고 싶으신가요?
                  </p>
                  <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
                    기술 후원, 인프라 지원, 협업 제안 모두 환영합니다.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#0b1220] px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-300 group-hover:translate-x-0.5">
                  chatbot@gistory.me
                  <svg
                    className="h-4 w-4"
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
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
