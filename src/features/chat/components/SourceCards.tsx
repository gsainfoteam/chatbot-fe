import { Fragment } from "react";
import type { ChatSource } from "../types";

interface SourceCardsProps {
  sources: ChatSource[];
}

/** 제목이 없을 때: URL 마지막 경로 조각을 디코딩해서 사용 */
function fallbackTitle(url: string): string {
  try {
    const segment = new URL(url).pathname.split("/").filter(Boolean).pop();
    return segment ? decodeURIComponent(segment) : url;
  } catch {
    return url;
  }
}

/**
 * 답변 출처 (Figma 최종 03 'Source references'): '함께 확인할 자료' 카드 안에
 * 자료 제목을 가운뎃점으로 이어 보여주고, 각 제목은 원문을 새 탭으로 엽니다.
 */
export default function SourceCards({ sources }: SourceCardsProps) {
  if (sources.length === 0) return null;

  return (
    <section
      aria-label="함께 확인할 자료"
      className="flex flex-col gap-4 rounded-chat-lg border border-chat-border bg-chat-surface p-5 leading-normal font-medium"
    >
      <h3 className="text-[13px] text-chat-muted">함께 확인할 자료</h3>
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-base text-chat-ink">
        {sources.map((source, index) => (
          <Fragment key={`${source.url}-${index}`}>
            {index > 0 && (
              <li aria-hidden="true" className="text-chat-subtle">
                ·
              </li>
            )}
            <li className="min-w-0">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-chat-sm break-words underline-offset-4 transition-colors hover:text-chat-brand-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand"
              >
                {source.title || fallbackTitle(source.url)}
                {source.type === "image" && (
                  <span className="text-chat-subtle"> (이미지)</span>
                )}
                <span className="sr-only"> (새 탭에서 열림)</span>
              </a>
            </li>
          </Fragment>
        ))}
      </ul>
    </section>
  );
}
