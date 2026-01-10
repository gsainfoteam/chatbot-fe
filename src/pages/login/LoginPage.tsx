import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  generateAuthorizationUrl,
  handleOAuth2Callback,
  useTokenExchange,
} from "../../api/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string>("");
  const tokenExchange = useTokenExchange();

  useEffect(() => {
    // URL에서 code와 error 파라미터 확인
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    // 콜백 처리: code 또는 error가 있으면 OAuth2 콜백
    if (code || errorParam) {
      try {
        // Callback 파라미터 추출 및 검증
        const params = handleOAuth2Callback();

        // 에러가 있는 경우
        if (params.error) {
          setTimeout(() => {
            setError(
              params.error_description ||
                params.error ||
                "인증 중 오류가 발생했습니다."
            );
            setTimeout(() => {
              // URL 파라미터 제거 후 재시도
              window.location.href = "/login";
            }, 3000);
          }, 0);
          return;
        }

        // Authorization Code가 있는 경우 토큰 교환
        if (params.code) {
          tokenExchange.mutate(params.code, {
            onSuccess: () => {
              navigate("/dashboard");
            },
            onError: (error: Error) => {
              setError(
                error.message || "토큰 교환에 실패했습니다. 다시 시도해주세요."
              );
              setTimeout(() => {
                window.location.href = "/login";
              }, 3000);
            },
          });
          return;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "인증 처리 중 오류가 발생했습니다.";
        setTimeout(() => {
          setError(errorMessage);
          setTimeout(() => {
            window.location.href = "/login";
          }, 3000);
        }, 0);
        return;
      }
    }

    // 콜백이 아닌 경우 OAuth2 Authorization URL로 리다이렉트
    generateAuthorizationUrl()
      .then((url) => {
        window.location.href = url;
      })
      .catch((error) => {
        console.error("OAuth2 인증 URL 생성 실패:", error);
        setError("인증 URL 생성에 실패했습니다.");
      });
  }, [searchParams, navigate, tokenExchange]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full bg-white p-8 border border-red-200 rounded-md">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">
            인증 실패
          </h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-500">3초 후 다시 시도합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#df3326] mb-4"></div>
        <p className="text-gray-600">로그인 중...</p>
      </div>
    </div>
  );
}
