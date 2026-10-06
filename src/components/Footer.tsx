import { GithubIcon, MailIcon } from "./Icons";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 sm:pt-12 sm:pb-8">
        <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-[1.4fr_1fr_1fr] md:gap-8 lg:gap-12">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2">
              <img
                src="/logo.svg"
                alt="GIST 챗봇 로고"
                className="h-8 w-8 sm:h-9 sm:w-9"
              />
              <p className="text-base font-semibold text-gray-900 sm:text-lg">
                GIST 챗봇
              </p>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              GIST 학생들을 위한 챗봇 서비스
            </p>
            <div className="mt-4 flex items-center justify-center gap-2.5 md:justify-start">
              <a
                href="https://github.com/gsainfoteam"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Infoteam GitHub으로 이동"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors duration-200 hover:border-gray-300 hover:text-gray-900"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
              <a
                href="mailto:chatbot@gistory.me"
                aria-label="메일로 문의하기"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors duration-200 hover:border-[#df3326]/40 hover:text-[#df3326]"
              >
                <MailIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          <nav aria-label="소개" className="text-center md:text-left">
            <h2 className="text-sm font-semibold text-gray-900">소개</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-gray-500">
              <li>
                <a
                  href="https://introduce.gistory.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-[#df3326]"
                >
                  인포팀 소개
                </a>
              </li>
              <li>
                <a
                  href="https://chatbot.gistory.me/docs/quick-start"
                  className="transition-colors hover:text-[#df3326]"
                >
                  챗봇 시작하기
                </a>
              </li>
              <li>
                <a
                  href="https://chatbot.gistory.me/docs/faq"
                  className="transition-colors hover:text-[#df3326]"
                >
                  자주 묻는 질문
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label="바로가기" className="text-center md:text-left">
            <h2 className="text-sm font-semibold text-gray-900">바로가기</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-gray-500">
              <li>
                <a
                  href="https://gijol.vercel.app/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-[#df3326]"
                >
                  Gijol
                </a>
              </li>
              <li>
                <a
                  href="https://ziggle.gistory.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-[#df3326]"
                >
                  Ziggle
                </a>
              </li>
              <li>
                <a
                  href="https://www.gist.ac.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-[#df3326]"
                >
                  GIST 홈페이지
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="max-w-5xl mx-auto mt-8 border-t border-gray-200 pt-5 text-center sm:mt-10">
          <p className="text-xs text-gray-400">
            © 2026. INFOTEAM all rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
