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
      faviconUrl: `${url.origin}/favicon.ico`,
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
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: CitationNode[];
}

const nodeText = (node: CitationNode): string =>
  node.value ?? node.children?.map(nodeText).join("") ?? "";
const citationLabel = (text: string) => text.replace(/[[\]\s]/g, "");

/** Hide only redundant, trailing source labels; preserve links used in prose. */
export function compactCitations(sources: CitationSource[]) {
  return () => (tree: CitationNode) => {
    const seen = new Set<string>();
    let badges = 0;
    const isSourceLabel = (node: CitationNode) => {
      if (node.tagName !== "a" || typeof node.properties?.href !== "string")
        return false;
      const source = citationSourceFor(node.properties.href, sources);
      return (
        !!source &&
        citationLabel(nodeText(node)) === citationLabel(source.title)
      );
    };
    const visit = (node: CitationNode, following: CitationNode[] = []) => {
      if (node.tagName === "a" && typeof node.properties?.href === "string") {
        const link = externalLinkInfo(node.properties.href);
        if (
          link &&
          (link.isZiggleNotice || citationSourceFor(link.href, sources))
        ) {
          const quiet = seen.has(link.key) || badges >= 3;
          node.properties.dataCitationQuiet = quiet;
          node.properties.dataCitationHidden =
            quiet &&
            isSourceLabel(node) &&
            following.every(
              (sibling) =>
                isSourceLabel(sibling) ||
                (!sibling.tagName && /^[\s.,;:!?。]*$/.test(nodeText(sibling))),
            );
          if (!quiet) badges++;
          seen.add(link.key);
        }
      }
      node.children?.forEach((child, index, children) =>
        visit(child, children.slice(index + 1)),
      );
    };
    visit(tree);
  };
}

// Streamdown caches processors by plugin name and serialized options. A closure
// alone would reuse the first answer's sources for every subsequent answer.
export function rehypeCompactCitations(sources: CitationSource[]) {
  return compactCitations(sources)();
}
