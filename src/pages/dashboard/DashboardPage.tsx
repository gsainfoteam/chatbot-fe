import { useNavigate } from "react-router-dom";
import { removeToken } from "../../api/auth";
import DashboardContent from "./DashboardContent";

export default function DashboardPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 네비게이션 */}
      <nav
        className="bg-white border-b border-gray-200"
        style={{ borderColor: "#e5e5e5" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img src="/logo.svg" alt="logo" className="w-10 h-10" />
            <h1 className="text-xl font-bold text-gray-900">GIST 챗봇</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-150 border border-gray-200/60"
            >
              로그아웃
            </button>
          </div>
        </div>
      </nav>

      {/* 대시보드 컨텐츠 */}
      <DashboardContent />
    </div>
  );
}
