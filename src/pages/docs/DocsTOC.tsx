import { useEffect, useState, useCallback } from "react";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export default function DocsTOC() {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  // 페이지의 헤딩 요소들을 스캔
  const scanHeadings = useCallback(() => {
    const contentArea = document.querySelector("main");
    if (!contentArea) return;

    const elements = contentArea.querySelectorAll("h2, h3");
    const items: TOCItem[] = [];

    elements.forEach((el, index) => {
      // ID가 없으면 생성
      if (!el.id) {
        const text = el.textContent || "";
        el.id = `heading-${index}-${text
          .toLowerCase()
          .replace(/[^a-z0-9가-힣]/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 50)}`;
      }

      items.push({
        id: el.id,
        text: el.textContent || "",
        level: el.tagName === "H2" ? 2 : 3,
      });
    });

    setHeadings(items);

    // 초기 active 설정
    if (items.length > 0) {
      setActiveId(items[0].id);
    }
  }, []);

  // 스크롤 시 현재 섹션 감지
  useEffect(() => {
    const handleScroll = () => {
      if (headings.length === 0) return;

      const scrollPosition = window.scrollY + 100; // offset for header

      // 현재 보이는 섹션 찾기
      for (let i = headings.length - 1; i >= 0; i--) {
        const element = document.getElementById(headings[i].id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveId(headings[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // 초기 실행

    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  // 페이지 변경 시 헤딩 재스캔
  useEffect(() => {
    // 약간의 지연 후 스캔 (컴포넌트 렌더링 완료 대기)
    const timer = setTimeout(scanHeadings, 100);
    return () => clearTimeout(timer);
  }, [scanHeadings]);

  // URL 변경 감지
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTimeout(scanHeadings, 100);
    });

    const contentArea = document.querySelector("main");
    if (contentArea) {
      observer.observe(contentArea, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, [scanHeadings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // header height
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
      setActiveId(id);
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className="hidden xl:block w-64 shrink-0">
      <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <nav className="pl-4 border-l border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">목차</h4>
          <ul className="space-y-2">
            {headings.map((heading) => (
              <li
                key={heading.id}
                className={heading.level === 3 ? "ml-3" : ""}
              >
                <button
                  onClick={() => handleClick(heading.id)}
                  className={`text-left text-sm transition-colors duration-200 hover:text-[#df3326] line-clamp-2 ${
                    activeId === heading.id
                      ? "text-[#df3326] font-medium"
                      : "text-gray-600"
                  }`}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
