// 메인 App 컴포넌트 - 라우팅 관리

import { Routes, Route, useLocation } from "react-router-dom";
import ChatWidget from "./widget/ChatWidget.tsx";
import LoginPage from "./pages/login/LoginPage.tsx";
import DashboardPage from "./pages/dashboard/DashboardPage.tsx";
import KeysPage from "./pages/keys/KeysPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import LandingPage from "./pages/landing/LandingPage.tsx";
import Header from "./components/Header.tsx";

export default function App() {
  const location = useLocation();
  const isWidgetPage = location.pathname.startsWith("/widget");

  return (
    <>
      {/* 위젯 페이지가 아닐 때만 헤더 표시 */}
      {!isWidgetPage && <Header />}

      <Routes>
        {/* 채팅 위젯 */}
        <Route path="/widget/*" element={<ChatWidget />} />

        {/* 랜딩 페이지 */}
        <Route path="/" element={<LandingPage />} />

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
        <Route
          path="/keys"
          element={
            <ProtectedRoute>
              <KeysPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
