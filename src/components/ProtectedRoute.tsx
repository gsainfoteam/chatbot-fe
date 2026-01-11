import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useVerifyToken, getToken } from "../api/auth";
import LoadingSpinner from "./LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = getToken();
  const [retryCount, setRetryCount] = useState(0);

  // 토큰이 있을 때만 검증 활성화
  const shouldVerify = !!token;
  const { data, isLoading, isError, refetch } = useVerifyToken(shouldVerify);

  // 에러 발생 시 재시도 (인터셉터가 토큰 갱신 중일 수 있음)
  useEffect(() => {
    if (isError && token && retryCount < 2) {
      // 인터셉터가 토큰 갱신을 시도하는 동안 잠시 대기 후 재시도
      const timer = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        refetch();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isError, token, retryCount, refetch]);

  // 토큰이 없으면 로그인 페이지로
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 로딩 중
  if (isLoading) {
    return (
      <LoadingSpinner
        message="로딩 중..."
        fullScreen
        className="bg-gray-50/55"
      />
    );
  }

  // 인증 실패 또는 에러 (응답에 uuid가 있으면 유효)
  // 재시도 횟수를 초과한 경우에만 로그인 페이지로 리다이렉트
  if ((isError || !data?.uuid) && retryCount >= 2) {
    return <Navigate to="/login" replace />;
  }

  // 에러가 있지만 재시도 중인 경우 로딩 표시
  if (isError && retryCount < 2) {
    return (
      <LoadingSpinner
        message="인증 확인 중..."
        fullScreen
        className="bg-gray-50/55"
      />
    );
  }

  return <>{children}</>;
}
