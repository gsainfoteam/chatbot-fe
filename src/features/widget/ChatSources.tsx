import { createContext, useContext, useMemo, type ReactNode } from "react";
import { ArrowUpRight, Globe2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import Tooltip from "@/components/common/Tooltip";
import type { ChatMessage } from "./types";
import {
  citationSourceFor,
  externalLinkInfo,
  type CitationSource,
} from "./sourcePresentation";

const CitationContext = createContext<CitationSource[]>([]);

function SourceMark({
  ziggle,
  compact = false,
}: {
  ziggle: boolean;
  compact?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${compact ? "size-4" : "size-7 border border-[var(--color-border,#e2e8f0)]"}`}
      style={{
        background: ziggle
          ? "#fff3e8"
          : "color-mix(in srgb, var(--color-text-secondary, #64748b) 8%, var(--color-assistant-message-bg, #fff))",
      }}
    >
      {ziggle ? (
        <img
          src="/ziggle-symbol.svg"
          alt=""
          className={compact ? "size-3.5" : "size-5"}
        />
      ) : (
        <Globe2
          className={compact ? "size-3" : "size-3.5"}
          style={{ color: "var(--color-text-secondary, #64748b)" }}
        />
      )}
    </span>
  );
}

function SourceIdentity({
  source,
  domainTitle = false,
}: {
  source: CitationSource;
  domainTitle?: boolean;
}) {
  const link = externalLinkInfo(source.url);
  if (!link) return null;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <SourceMark ziggle={link.isZiggleNotice} />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium leading-4">
          <span
            className={
              domainTitle
                ? "truncate text-[13px] text-[var(--color-primary,#df3326)] group-hover:underline underline-offset-2"
                : "truncate"
            }
          >
            {link.isZiggleNotice ? "Ziggle" : link.hostname}
          </span>
          {"official" in source && (
            <span
              className="shrink-0 text-[10px] font-normal text-[var(--color-text-secondary,#64748b)]"
              title={
                source.official
                  ? "학교가 사용하는 공식 도메인이며, 내용의 정확성이나 승인을 보증하지 않습니다."
                  : "학교 공식 도메인 외의 출처입니다."
              }
            >
              · {source.official ? "학교 공식" : "외부 출처"}
            </span>
          )}
          {link.isZiggleNotice && (
            <span className="shrink-0 text-[10px] font-normal text-[var(--color-text-secondary,#64748b)]">
              · 공지
            </span>
          )}
        </span>
        <span className="block truncate text-[10px] font-normal leading-4 text-[var(--color-text-secondary,#64748b)]">
          {domainTitle
            ? link.path || link.hostname
            : `${link.hostname}${link.path ? ` › ${link.path}` : ""}`}
        </span>
      </span>
    </span>
  );
}

function CitationLink({
  href,
  children,
}: {
  href?: string;
  children?: ReactNode;
}) {
  const sources = useContext(CitationContext);
  const link = externalLinkInfo(href);
  if (!link) return <span>{children}</span>;
  const source = citationSourceFor(href, sources);
  // Old messages and early content chunks can still use the supplied Ziggle URL.
  // Other links only become citations when the backend includes that exact source.
  if (!source && !link.isZiggleNotice) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--color-primary,#df3326)] underline decoration-current/30 underline-offset-2 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {children}
      </a>
    );
  }
  const label = link.isZiggleNotice ? "Ziggle" : link.hostname;
  const title = link.isZiggleNotice
    ? source?.title || children
    : children || source?.title;
  return (
    <Tooltip
      side="top"
      align="start"
      content={
        <span className="block py-0.5">
          <span className="mb-2 flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary,#64748b)]">
            <SourceMark ziggle={link.isZiggleNotice} compact />
            {label}
          </span>
          <span className="block text-xs font-medium leading-relaxed text-[var(--color-text,#1e293b)]">
            {title}
          </span>
          <span className="mt-1 block break-all text-[10px] text-[var(--color-text-secondary,#64748b)]">
            {link.hostname}
            {link.path ? ` › ${link.path}` : ""}
          </span>
          <span className="mt-2 block text-[10px] text-[var(--color-text-secondary,#64748b)]">
            클릭하면 원문을 새 탭에서 열어요 ↗
          </span>
        </span>
      }
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-citation="true"
        aria-label={`${typeof title === "string" ? title : label} — ${label} 출처, 새 탭에서 열기`}
        className="mx-0.5 inline-flex max-w-[min(100%,180px)] items-center gap-1 rounded-full px-1.5 py-0.5 align-baseline text-[11px] leading-4 font-medium no-underline transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#df3326)]"
        style={{
          color: "var(--color-text-secondary, #64748b)",
          background:
            "color-mix(in srgb, var(--color-text-secondary, #64748b) 10%, var(--color-assistant-message-bg, #fff))",
        }}
      >
        <SourceMark ziggle={link.isZiggleNotice} compact />
        <span className="truncate">{label}</span>
      </a>
    </Tooltip>
  );
}

const markdownComponents = { a: CitationLink };

export function AnswerContent({ message }: { message: ChatMessage }) {
  const sources = useMemo(
    () => [...(message.externalSources ?? []), ...(message.webSources ?? [])],
    [message.externalSources, message.webSources],
  );
  return (
    <CitationContext.Provider value={sources}>
      <Streamdown
        plugins={{ code }}
        skipHtml
        rehypePlugins={[]}
        components={markdownComponents}
        isAnimating={message.status === "streaming"}
        className="text-[var(--color-text,#1e293b)]"
      >
        {message.text}
      </Streamdown>
    </CitationContext.Provider>
  );
}

export function ExternalSourceList({ sources }: { sources: CitationSource[] }) {
  return (
    <ul className="m-0 flex min-w-0 list-none flex-col gap-1 p-0">
      {sources.map((source) => {
        const link = externalLinkInfo(source.url);
        if (!link) return null;
        const domainTitle =
          source.title.replace(/^www\./, "").replace(/\/$/, "") ===
          link.hostname;
        return (
          <li key={source.url} className="min-w-0">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${source.title} — ${link.isZiggleNotice ? "Ziggle 공지" : link.hostname}, 새 탭에서 열기`}
              className="group block min-w-0 rounded-xl border border-transparent px-2 py-2.5 transition hover:border-[var(--color-border,#e2e8f0)] hover:bg-[color-mix(in_srgb,var(--color-text-secondary,#64748b)_5%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary,#df3326)]"
              style={{ color: "var(--color-text,#1e293b)" }}
            >
              <SourceIdentity source={source} domainTitle={domainTitle} />
              {!domainTitle && (
                <span className="mt-1.5 flex items-start gap-1 pl-9">
                  <span
                    className="min-w-0 flex-1 break-words text-[13px] font-medium leading-[1.55] group-hover:underline underline-offset-2"
                    style={{ color: "var(--color-primary,#df3326)" }}
                  >
                    {source.title}
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="mt-1 size-3 shrink-0 text-[var(--color-text-secondary,#64748b)] opacity-60"
                  />
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
