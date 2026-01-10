import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { getToken, logoutFromOAuth2, revokeToken } from "../api/auth";
import { BookIcon, KeyIcon, ChartBarIcon, MenuIcon, XIcon } from "./Icons";

export default function Header() {
  const navigate = useNavigate();
  const isAuthenticated = !!getToken();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);

    // 1. 백엔드 로그아웃 (토큰 무효화 + 로컬 토큰 삭제)
    await revokeToken();

    // 2. OAuth Provider 로그아웃 (선택사항 - 환경 변수가 설정되어 있으면 실행)
    const logoutUrl = import.meta.env.VITE_OAUTH2_LOGOUT_URL;
    if (logoutUrl) {
      try {
        await logoutFromOAuth2();
        // logoutFromOAuth2가 리다이렉트를 처리하므로 여기서 return
        return;
      } catch (error) {
        console.error("OAuth2 로그아웃 실패:", error);
      }
    }

    // 3. 홈으로 이동
    window.location.replace("/");
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity duration-200"
          >
            <img src="/logo.svg" alt="logo" className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="text-base sm:text-lg font-semibold text-gray-900">
              GIST 챗봇
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-2">
            <a
              href="https://github.com/gsainfoteam/chatbot-fe"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 inline-flex items-center gap-1.5"
            >
              <BookIcon className="w-4 h-4" />
              문서
            </a>
            <Link
              to="/keys"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 inline-flex items-center gap-1.5"
            >
              <KeyIcon className="w-4 h-4" />키 발급
            </Link>
            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 inline-flex items-center gap-1.5"
            >
              <ChartBarIcon className="w-4 h-4" />
              대시보드
            </Link>
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium bg-[#df3326] text-white rounded-lg hover:bg-[#c72a1f] transition-all duration-200"
              >
                로그아웃
              </button>
            )}
            {!isAuthenticated && (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium bg-[#df3326] text-white rounded-lg hover:bg-[#c72a1f] transition-all duration-200"
              >
                로그인
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            aria-label="메뉴 열기"
          >
            {isMobileMenuOpen ? (
              <XIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200/60 py-4 space-y-2">
            <a
              href="https://github.com/gsainfoteam/chatbot-fe"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMobileMenu}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <BookIcon className="w-4 h-4" />
              문서 보기
            </a>
            <Link
              to="/dashboard"
              onClick={closeMobileMenu}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <ChartBarIcon className="w-4 h-4" />
              대시보드
            </Link>
            <Link
              to="/keys"
              onClick={closeMobileMenu}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <KeyIcon className="w-4 h-4" />키 발급
            </Link>
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium bg-[#df3326] text-white rounded-lg hover:bg-[#c72a1f] transition-all duration-200"
              >
                로그아웃
              </button>
            )}
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium bg-[#df3326] text-white rounded-lg hover:bg-[#c72a1f] transition-all duration-200"
              >
                로그인
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
