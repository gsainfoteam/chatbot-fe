import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTokenExchange } from "../../api/auth";
import { handleOAuth2Callback } from "../../api/auth";

export default function OAuth2CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const tokenExchange = useTokenExchange();

  useEffect(() => {
    try {
      // Callback 파라미터 추출 및 검증
      const params = handleOAuth2Callback();

      // 에러가 있는 경우
      if (params.error) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setError(
          params.error_description ||
            params.error ||
            "인증 중 오류가 발생했습니다."
        );
        setTimeout(() => {
          navigate("/login");
        }, 3000);
        return;
      }

      // Authorization Code가 없는 경우
      if (!params.code) {
        setError("Authorization Code를 받지 못했습니다.");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
        return;
      }

      // 토큰 교환
      tokenExchange.mutate(params.code, {
        onSuccess: () => {
          navigate("/dashboard");
        },
        onError: (error: Error) => {
          setError(
            error.message || "토큰 교환에 실패했습니다. 다시 시도해주세요."
          );
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "인증 처리 중 오류가 발생했습니다.";
      setError(errorMessage);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    }
  }, [navigate, tokenExchange]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full bg-white p-8 border border-red-200 rounded-md">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">
            인증 실패
          </h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            3초 후 로그인 페이지로 이동합니다...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#df3326] mb-4"></div>
        <p className="text-gray-600">인증 처리 중...</p>
      </div>
    </div>
  );
}
