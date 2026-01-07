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
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="logo" className="w-8 h-8" />
            <span className="text-lg font-semibold text-gray-900">
              Chatbot Widget
            </span>
          </Link>
          <div className="flex gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-150 inline-flex items-center gap-1.5"
            >
              문서 보기
            </a>
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-150"
                >
                  대시보드
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-150 border border-gray-200/60"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-150"
                >
                  로그인
                </Link>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-sm font-medium bg-[#df3326] text-white rounded-md hover:bg-[#c72a1f] transition-colors duration-150"
                >
                  대시보드
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
