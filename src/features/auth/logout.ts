import { logoutFromOAuth2, revokeToken } from "@/api/auth";

/**
 * 로그아웃 공통 플로우: 백엔드 토큰 무효화 → (설정돼 있으면) OAuth Provider 로그아웃 → 홈으로.
 * 헤더와 채팅 사이드바가 같이 씁니다.
 */
export async function performLogout(): Promise<void> {
  // 1. 백엔드 로그아웃 (토큰 무효화 + 로컬 토큰 삭제)
  await revokeToken();

  // 2. OAuth Provider 로그아웃 (선택사항 - 환경 변수가 설정되어 있으면 실행)
  const logoutUrl = import.meta.env.VITE_OAUTH2_LOGOUT_URL;
  if (logoutUrl) {
    try {
      await logoutFromOAuth2();
      // logoutFromOAuth2가 리다이렉트를 처리하므로 여기서 return
      return;
    } catch (error) {
      console.error("OAuth2 로그아웃 실패:", error);
    }
  }

  // 3. 홈으로 이동
  window.location.replace("/");
}
