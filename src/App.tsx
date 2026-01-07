// 메인 App 컴포넌트 - 라우팅 관리

import { Routes, Route, Navigate } from "react-router-dom";
import ChatWidget from "./widget/ChatWidget.tsx";
import LoginPage from "./pages/login/LoginPage.tsx";
import DashboardPage from "./pages/dashboard/DashboardPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

export default function App() {
  return (
    <Routes>
      {/* 위젯은 별도 경로로 분리 */}
      <Route path="/widget" element={<ChatWidget />} />

      {/* 관리자 영역 */}
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* 루트는 대시보드로 리다이렉트 */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

