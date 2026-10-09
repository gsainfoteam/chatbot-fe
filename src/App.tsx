// 메인 App 컴포넌트 - 라우팅 관리

import { Routes, Route, useLocation } from "react-router-dom";
import { ChatWidget } from "@/features/widget";
import { ChatShell } from "@/features/chat";
import LoginPage from "./pages/login/LoginPage.tsx";
import DashboardPage from "./pages/dashboard/DashboardPage.tsx";
import KeysPage from "./pages/keys/KeysPage.tsx";
import UploadPage from "./pages/upload/UploadPage.tsx";
import { ProtectedRoute } from "@/features/auth";
import HomePage from "./pages/home/HomePage.tsx";
import ThreadPage from "./pages/thread/ThreadPage.tsx";
import DocsPage from "./pages/docs/DocsPage.tsx";
import Header from "./components/Header.tsx";
import Footer from "./components/Footer.tsx";

export default function App() {
  const location = useLocation();
  const isWidgetPage = location.pathname.startsWith("/widget");
  // 홈(새 채팅)과 대화 화면은 자체 사이드바 레이아웃을 쓰므로 공통 헤더·푸터를 숨긴다
  const isChatPage =
    location.pathname === "/" || location.pathname.startsWith("/c/");
  const showChrome = !isWidgetPage && !isChatPage;

  return (
    <>
      {showChrome && <Header />}

      <Routes>
        {/* 채팅 위젯 */}
        <Route path="/widget/*" element={<ChatWidget />} />

        {/* 홈(새 채팅) + 대화 */}
        <Route element={<ChatShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/c/:threadId" element={<ThreadPage />} />
        </Route>

        {/* 문서 페이지 */}
        <Route path="/docs/*" element={<DocsPage />} />

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
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />
      </Routes>

      {showChrome && <Footer />}
    </>
  );
}
