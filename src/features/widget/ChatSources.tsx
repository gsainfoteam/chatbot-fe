import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Globe2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import Tooltip from "@/components/common/Tooltip";
import type { ChatMessage } from "./types";
import {
  citationSourceFor,
  compactCitations,
  externalLinkInfo,
  type CitationSource,
} from "./sourcePresentation";

const CitationContext = createContext<CitationSource[]>([]);

function SourceMark({ ziggle }: { ziggle: boolean }) {
  return ziggle ? (
    <img
      src="/ziggle-symbol.svg"
      alt=""
      aria-hidden="true"
      className="size-3.5 shrink-0"
    />
  ) : (
    <Globe2 aria-hidden="true" className="size-3 shrink-0" />
  );
}

function CitationLink({
  href,
  children,
  node,
}: {
  href?: string;
  children?: ReactNode;
  node?: { properties?: Record<string, unknown> };
}) {
  const sources = useContext(CitationContext);
  const link = externalLinkInfo(href);
  if (!link) return <span>{children}</span>;
  const source = citationSourceFor(href, sources);
  // Old messages and early content chunks can still use the supplied Ziggle URL.
  // Other links only become citations when the backend includes that exact source.
  if (
    (!source && !link.isZiggleNotice) ||
    node?.properties?.dataCitationQuiet
  ) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-inherit decoration-current/20 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
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
      className="compact-citation-tooltip max-w-52 rounded-md px-2 py-1.5 shadow-sm"
      content={
        <span className="line-clamp-2 text-[11px] leading-4">{title}</span>
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
        <SourceMark ziggle={link.isZiggleNotice} />
        <span className="truncate">{label}</span>
      </a>
    </Tooltip>
  );
}

const markdownComponents = { a: CitationLink };
// A single tree gives citation placement a deterministic, answer-wide scope,
// including when earlier paragraphs are cached or the stream is rerendered.
const answerBlocks = (text: string) => [text];

export function AnswerContent({ message }: { message: ChatMessage }) {
  const sources = useMemo(
    () => [...(message.externalSources ?? []), ...(message.webSources ?? [])],
    [message.externalSources, message.webSources],
  );
  const citationPlugins = useMemo(() => [compactCitations(sources)], [sources]);
  return (
    <CitationContext.Provider value={sources}>
      <Streamdown
        plugins={{ code }}
        skipHtml
        rehypePlugins={citationPlugins}
        parseMarkdownIntoBlocksFn={answerBlocks}
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
    <ul className="m-0 flex min-w-0 list-none flex-col gap-0.5 p-0">
      {sources.map((source) => {
        const link = externalLinkInfo(source.url);
        if (!link) return null;
        const label = source.title.replace(/^www\./, "");
        return (
          <li key={source.url} className="min-w-0">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              title={source.title}
              aria-label={`${source.title} — ${link.hostname}, 새 탭에서 열기`}
              className="flex min-w-0 items-center gap-1.5 rounded py-1 text-[11px] leading-4 text-[var(--color-text-secondary,#64748b)] hover:text-[var(--color-text,#1e293b)] hover:underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-1"
            >
              <SourceMark ziggle={link.isZiggleNotice} />
              <span className="truncate">{label}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
