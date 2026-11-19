import { useEffect, useState } from "react";

function formatRemaining(retryAt: number, now: number): string {
  if (now >= retryAt) return "이제 다시 시도할 수 있습니다.";
  const sec = Math.ceil((retryAt - now) / 1000);
  if (sec < 60) return `${sec}초 후에 다시 시도할 수 있습니다.`;
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  if (s === 0) return `${min}분 후에 다시 시도할 수 있습니다.`;
  return `${min}분 ${s}초 후에 다시 시도할 수 있습니다.`;
}

export default function QuestionLimitNotice({
  retryAt,
  onRestartSession,
  restartDisabled = false,
}: {
  retryAt: number | null;
  onRestartSession?: () => void;
  restartDisabled?: boolean;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!retryAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [retryAt]);

  if (retryAt && now >= retryAt) return null;
  return (
    <div
      role="status"
      className="px-3 pb-2"
      style={{ backgroundColor: "var(--color-background, #ffffff)" }}
    >
      <div
        className="w-full text-xs sm:text-sm rounded-xl px-3 py-2"
        style={{
          backgroundColor: "#fee2e2",
          color: "#7f1d1d",
          border: "1px solid #fecaca",
        }}
      >
        <div className="font-semibold">
          한 번에 최대 5번까지만 질문할 수 있습니다.
        </div>
        {retryAt && (
          <div className="mt-0.5 opacity-90">
            {formatRemaining(retryAt, now)}
          </div>
        )}
        {onRestartSession && (
          <div className="mt-2">
            <p className="text-xs opacity-90">
              테스트를 계속하려면 새 세션을 시작하세요. 현재 대화는 초기화됩니다.
            </p>
            <button
              type="button"
              className="mt-2 rounded-lg border border-current px-3 py-1.5 font-semibold hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={restartDisabled}
              onClick={onRestartSession}
            >
              새 세션 시작
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
