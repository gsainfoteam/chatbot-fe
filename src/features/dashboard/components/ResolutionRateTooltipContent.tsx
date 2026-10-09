/**
 * 해결률 (i) 툴팁 내용.
 * 설명 문단 → 구분선 → 계산식. 모든 요소가 같은 왼쪽 기준선에 정렬됩니다.
 */
export default function ResolutionRateTooltipContent() {
  return (
    <div>
      <p>
        전체 대화 중 사용자 문제가 해결된 것으로
        <br />
        판단된 대화의 비율입니다.
      </p>

      <div className="mt-2.5 border-t border-[var(--color-primary)]/15 pt-2.5">
        <p className="font-medium">해결률은 다음과 같이 계산됩니다.</p>
        <div
          className="mt-2 flex items-center gap-2 leading-tight"
          role="math"
          aria-label="해결률(%) = 해결된 대화 수 ÷ 전체 대화 수 × 100"
        >
          <span className="font-semibold text-[var(--color-primary)]">
            해결률(%)
          </span>
          <span className="text-gray-400">=</span>
          <span className="inline-flex flex-col items-center text-center text-[11px]">
            <span className="pb-1">해결된 대화 수</span>
            <span
              aria-hidden
              className="h-px w-full bg-[var(--color-text)]/40"
            />
            <span className="pt-1">전체 대화 수</span>
          </span>
          <span className="text-gray-400">×</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}
