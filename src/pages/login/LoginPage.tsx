import { useEffect, useState, useRef } from "react";
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const tokenExchange = useTokenExchange();

  // 토큰 교환 중복 방지를 위한 ref
  const isExchangingRef = useRef(false);

  useEffect(() => {
    // 이미 토큰 교환 중이면 중복 실행 방지
    if (isExchangingRef.current) {
      return;
    }

    // URL에서 code와 error 파라미터 확인
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    // 콜백 처리: code 또는 error가 있으면 OAuth2 콜백
    if (code || errorParam) {
      // 이미 처리 중인지 확인 (localStorage로 중복 방지)
      const processingCode = sessionStorage.getItem("oauth2_processing_code");
      if (processingCode === code) {
        // 이미 처리 중인 코드면 무시
        return;
      }

      try {
        // Callback 파라미터 추출 및 검증
        const params = handleOAuth2Callback();

        // 에러가 있는 경우
        if (params.error) {
          setTimeout(() => {
            const errorMsg = params.error_description
              ? `${params.error}: ${params.error_description}`
              : params.error || "인증 중 오류가 발생했습니다.";
            setError(errorMsg);
            setIsLoading(false);
          }, 0);
          return;
        }

        // Authorization Code가 있는 경우 토큰 교환
        if (params.code) {
          // 중복 실행 방지
          isExchangingRef.current = true;
          sessionStorage.setItem("oauth2_processing_code", params.code);

          tokenExchange.mutate(params.code, {
            onSuccess: () => {
              sessionStorage.removeItem("oauth2_processing_code");
              // history를 없애고 홈으로 이동
              window.location.replace("/");
            },
            onError: (err: Error) => {
              sessionStorage.removeItem("oauth2_processing_code");
              isExchangingRef.current = false;
              setError(
                err.message || "토큰 교환에 실패했습니다. 다시 시도해주세요."
              );
              setIsLoading(false);
            },
          });
          return;
        }

        // code가 없는 경우
        setTimeout(() => {
          setError("Authorization Code를 받지 못했습니다.");
          setIsLoading(false);
        }, 0);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "인증 처리 중 오류가 발생했습니다.";
        setTimeout(() => {
          setError(errorMessage);
          setIsLoading(false);
        }, 0);
      }
      return;
    }

    // 콜백이 아닌 경우 OAuth2 Authorization URL로 리다이렉트
    generateAuthorizationUrl()
      .then((url) => {
        window.location.href = url;
      })
      .catch((err) => {
        console.error("OAuth2 인증 URL 생성 실패:", err);
        setError("인증 URL 생성에 실패했습니다.");
        setIsLoading(false);
      });
  }, [searchParams, navigate, tokenExchange]);

  if (error) {
    const handleRetry = () => {
      // 모든 OAuth2 관련 localStorage 항목 삭제 후 재시도
      localStorage.removeItem("oauth2_state");
      localStorage.removeItem("oauth2_code_verifier");
      localStorage.removeItem("oauth2_nonce");
      window.location.href = "/login";
    };

    const handleGoHome = () => {
      window.location.href = "/";
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-lg w-full bg-white p-8 border border-red-200 rounded-md">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">
            인증 실패
          </h1>
          <p className="text-gray-700 mb-4">{error}</p>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleRetry}
              className="flex-1 px-4 py-2 bg-[#df3326] text-white rounded-md hover:bg-[#c72a1f] transition-colors"
            >
              다시 시도
            </button>
            <button
              onClick={handleGoHome}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoading) {
    return null;
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
