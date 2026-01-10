interface LoadingSpinnerProps {
  message?: string;
  subText?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingSpinner({
  message = "로딩 중...",
  subText,
  size = "md",
  fullScreen = false,
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-[42px] h-[42px] border-[3px]",
    md: "w-[52px] h-[52px] border-4 max-[480px]:w-[42px] max-[480px]:h-[42px] max-[480px]:border-[3px]",
    lg: "w-[64px] h-[64px] border-[5px] max-[480px]:w-[52px] max-[480px]:h-[52px] max-[480px]:border-4",
  };

  const textSizeClasses = {
    sm: "text-[0.88rem]",
    md: "text-[0.95rem] max-[480px]:text-[0.88rem]",
    lg: "text-[1.1rem] max-[480px]:text-[0.95rem]",
  };

  const subTextSizeClasses = {
    sm: "text-[0.75rem]",
    md: "text-[0.85rem] max-[480px]:text-[0.75rem]",
    lg: "text-[0.95rem] max-[480px]:text-[0.85rem]",
  };

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center">
      {/* Spinner - 메인 테마 색상 사용 */}
      <div
        className={`${sizeClasses[size]} rounded-full border-[rgba(223,51,38,0.25)] border-t-[#df3326] loading-spinner shadow-[0_0_10px_rgba(223,51,38,0.25)]`}
      />

      {/* Main Text - 메인 테마 색상 사용 */}
      {message && (
        <p
          className={`mt-4 font-extrabold ${textSizeClasses[size]} text-[#df3326] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]`}
        >
          {message}
        </p>
      )}

      {/* Sub Text - 메인 테마 색상 어두운 버전 */}
      {subText && (
        <p
          className={`mt-2 ${subTextSizeClasses[size]} text-[#b42323] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]`}
        >
          {subText}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col items-center justify-center loading-overlay ${className}`}
        role="status"
        aria-label={message || "로딩 중"}
      >
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
}
