import { useEffect } from "react";
import { generateAuthorizationUrl } from "../../api/auth";

export default function LoginPage() {
  useEffect(() => {
    // OAuth2 Authorization URL로 즉시 리다이렉트
    generateAuthorizationUrl()
      .then((url) => {
        window.location.href = url;
      })
      .catch((error) => {
        console.error("OAuth2 인증 URL 생성 실패:", error);
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#df3326] mb-4"></div>
        <p className="text-gray-600">로그인 중...</p>
      </div>
    </div>
  );
}
