import { Link, useNavigate } from "react-router-dom";
import { getToken, removeToken } from "../api/auth";

export default function Header() {
  const navigate = useNavigate();
  const isAuthenticated = !!getToken();

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200"
          >
            <img src="/logo.svg" alt="logo" className="w-8 h-8" />
            <span className="text-lg font-semibold text-gray-900">
              GIST 챗봇
            </span>
          </Link>
          <div className="flex gap-2">
            <a
              href="https://github.com/gsainfoteam/chatbot-fe"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 inline-flex items-center gap-1.5"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              문서 보기
            </a>
            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 inline-flex items-center gap-1.5"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              대시보드
            </Link>
            <Link
              to="/keys"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 inline-flex items-center gap-1.5"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              키 발급
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
        </div>
      </div>
    </nav>
  );
}
