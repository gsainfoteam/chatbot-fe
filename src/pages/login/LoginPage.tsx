import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin, saveToken } from "../../api/auth";

// 개발 환경 확인
const isDev = import.meta.env.DEV || import.meta.env.MODE === "development";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 개발 환경: 이메일만 입력해도 통과
    if (isDev) {
      if (email) {
        saveToken("dev-token-" + Date.now());
        navigate("/dashboard");
        return;
      } else {
        setError("이메일을 입력해주세요.");
        return;
      }
    }

    // 프로덕션 환경: 실제 로그인 API 호출
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          navigate("/dashboard");
        },
        onError: (error: Error) => {
          setError(
            (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || error.message || "로그인에 실패했습니다."
          );
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">관리자 로그인</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <button
            type="submit"
            disabled={isDev ? false : loginMutation.isPending}
            className="w-full px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isDev ? "로그인" : loginMutation.isPending ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {isDev && (
          <p className="mt-4 text-xs text-gray-500 text-center">
            개발 모드: 이메일만 입력해도 로그인됩니다
          </p>
        )}
      </div>
    </div>
  );
}

