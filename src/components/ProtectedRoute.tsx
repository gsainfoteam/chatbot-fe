import { Navigate } from "react-router-dom";
import { useVerifyToken, getToken } from "../api/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// 개발 환경 확인
const isDev = import.meta.env.DEV || import.meta.env.MODE === "development";

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = getToken();

  // 개발 환경이 아니고 토큰이 있을 때만 검증 활성화
  const shouldVerify = !isDev && !!token;
  const { data, isLoading, isError } = useVerifyToken(shouldVerify);

  // 개발 환경에서는 검증 건너뛰기
  if (isDev) {
    return <>{children}</>;
  }

  // 토큰이 없으면 로그인 페이지로
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  // 인증 실패 또는 에러
  if (isError || !data?.valid) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
