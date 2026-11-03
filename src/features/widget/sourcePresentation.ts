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
