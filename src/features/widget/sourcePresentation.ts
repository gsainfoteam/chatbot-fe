import type { ExternalSource, WebSource } from "./types.ts";

export type CitationSource = ExternalSource | WebSource;

export function externalLinkInfo(href: string | undefined) {
  if (!href) return null;
  try {
    const url = new URL(href);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    const hostname = url.hostname.replace(/^www\./, "");
    let pathname = url.pathname;
    try {
      pathname = decodeURIComponent(pathname);
    } catch {
      /* Keep malformed escapes readable. */
    }
    return {
      href,
      key: url.href,
      hostname,
      path: pathname.split("/").filter(Boolean).join(" › "),
      isZiggleNotice:
        url.hostname === "ziggle.gistory.me" &&
        /^\/notice\/[^/]+\/?$/.test(url.pathname),
    };
  } catch {
    return null;
  }
}

/** Match registered URLs exactly; query parameters and fragments retain their meaning. */
export function citationSourceFor(
  href: string | undefined,
  sources: CitationSource[],
) {
  const link = externalLinkInfo(href);
  if (!link) return undefined;
  return sources.find(
    (source) => externalLinkInfo(source.url)?.key === link.key,
  );
}

interface CitationNode {
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: CitationNode[];
}

/** Keep at most three distinct source badges per answer; preserve other links and text. */
export function compactCitations(sources: CitationSource[]) {
  return () => (tree: CitationNode) => {
    const seen = new Set<string>();
    let badges = 0;
    const visit = (node: CitationNode) => {
      if (node.tagName === "a" && typeof node.properties?.href === "string") {
        const link = externalLinkInfo(node.properties.href);
        if (
          link &&
          (link.isZiggleNotice || citationSourceFor(link.href, sources))
        ) {
          const quiet = seen.has(link.key) || badges >= 3;
          node.properties.dataCitationQuiet = quiet;
          if (!quiet) badges++;
          seen.add(link.key);
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}
