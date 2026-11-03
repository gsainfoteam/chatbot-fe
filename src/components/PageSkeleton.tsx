interface PageSkeletonProps {
  label?: string;
}

// 페이지 로딩 스켈레톤 - 실제 페이지처럼 자리를 차지해 Footer가 위로 올라오지 않게 한다
export default function PageSkeleton({ label = "로딩 중" }: PageSkeletonProps) {
  return (
    <div
      className="min-h-[calc(100dvh-4rem)] bg-white"
      role="status"
      aria-label={label}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="mb-8">
          <div className="h-9 w-40 rounded bg-gray-200" />
          <div className="mt-3 h-4 w-80 max-w-full rounded bg-gray-200" />
        </div>
        <div className="h-24 mb-4 rounded-lg border border-gray-200 bg-gray-50" />
        <div className="grid gap-4 mb-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 rounded-lg border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
        <div className="h-80 rounded-lg border border-gray-200 bg-gray-50" />
      </div>
    </div>
  );
}
