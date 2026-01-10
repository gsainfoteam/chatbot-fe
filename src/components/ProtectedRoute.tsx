import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  useVerifyToken,
  getToken,
  isTokenExpired,
  useRefreshToken,
} from "../api/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = getToken();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshToken = useRefreshToken();

  // 토큰이 있을 때만 검증 활성화
  const shouldVerify = !!token && !isRefreshing;
  const { data, isLoading, isError } = useVerifyToken(shouldVerify);

  // Access Token 만료 체크 및 자동 갱신
  useEffect(() => {
    if (!token || isRefreshing) {
      return;
    }

    if (isTokenExpired()) {
      setIsRefreshing(true);
      refreshToken.mutate(undefined, {
        onSuccess: () => {
          setIsRefreshing(false);
        },
        onError: () => {
          setIsRefreshing(false);
          // 갱신 실패 시 로그인 페이지로 리다이렉트
          window.location.href = "/login";
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // 토큰이 없으면 로그인 페이지로
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 토큰 갱신 중
  if (isRefreshing || refreshToken.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#df3326] mb-4"></div>
          <div className="text-gray-500">토큰 갱신 중...</div>
        </div>
      </div>
    );
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#df3326] mb-4"></div>
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  // 인증 실패 또는 에러 (응답에 uuid가 있으면 유효)
  if (isError || !data?.uuid) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
