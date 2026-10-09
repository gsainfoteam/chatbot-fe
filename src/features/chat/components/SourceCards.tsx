import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { ChatSource } from "../types";

interface SourceCardsProps {
  sources: ChatSource[];
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
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

function SourceCard({ source }: { source: ChatSource }) {
  const [imageFailed, setImageFailed] = useState(false);
  const isImage = source.type === "image";
  const title = source.title || fallbackTitle(source.url);
  const host = hostnameOf(source.url);

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-w-0 flex-col gap-1.5 rounded-chat-lg border border-chat-border bg-chat-surface px-3.5 py-3 transition-colors hover:border-chat-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand"
    >
      <span className="flex items-center justify-between gap-2">
        <span
          className={
            isImage
              ? "shrink-0 rounded-full bg-chat-hover px-2 py-0.5 text-xs leading-4 font-semibold text-chat-ink-2"
              : "shrink-0 rounded-full bg-chat-brand-50 px-2 py-0.5 text-xs leading-4 font-semibold text-chat-brand-strong"
          }
        >
          {isImage ? "이미지" : "참고 자료"}
        </span>
        {host && (
          <span className="truncate text-xs leading-4 text-chat-subtle">{host}</span>
        )}
      </span>

      {isImage && !imageFailed && (
        <img
          src={source.url}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="aspect-video w-full rounded-chat-md border border-chat-border object-cover"
        />
      )}

      <span className="line-clamp-2 text-sm leading-5 font-semibold break-words text-chat-ink">
        {title}
      </span>

      <span className="flex items-center gap-1 text-[13px] leading-[18px] font-medium text-chat-brand-text">
        원문 보기
        <ExternalLink className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
      </span>
    </a>
  );
}

/** 답변 출처 카드 그리드 ("출처" 레이블 + 2열 카드) */
export default function SourceCards({ sources }: SourceCardsProps) {
  if (sources.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs leading-4 font-semibold tracking-[0.02em] text-chat-subtle">
        출처
      </span>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {sources.map((source, index) => (
          <SourceCard key={`${source.url}-${index}`} source={source} />
        ))}
      </div>
    </div>
  );
}
