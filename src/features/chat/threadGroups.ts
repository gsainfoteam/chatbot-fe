import type { ChatThread } from "./types";

export interface ThreadGroup {
  label: string;
  threads: ChatThread[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * 사이드바용 날짜 그룹핑: 오늘 / 어제 / 지난 7일 / 지난 30일 / 이전.
 * 각 그룹 안에서는 최근 대화가 위로 옵니다. 빈 그룹은 제외합니다.
 */
export function groupThreadsByDate(
  threads: ChatThread[],
  now: number = Date.now(),
): ThreadGroup[] {
  const today = startOfDay(now);
  const buckets: ThreadGroup[] = [
    { label: "오늘", threads: [] },
    { label: "어제", threads: [] },
    { label: "지난 7일", threads: [] },
    { label: "지난 30일", threads: [] },
    { label: "이전", threads: [] },
  ];

  const sorted = [...threads].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const thread of sorted) {
    const day = startOfDay(thread.updatedAt);
    const diffDays = Math.round((today - day) / DAY_MS);
    if (diffDays <= 0) buckets[0].threads.push(thread);
    else if (diffDays === 1) buckets[1].threads.push(thread);
    else if (diffDays < 7) buckets[2].threads.push(thread);
    else if (diffDays < 30) buckets[3].threads.push(thread);
    else buckets[4].threads.push(thread);
  }

  return buckets.filter((bucket) => bucket.threads.length > 0);
}

/** 사이드바 검색: 제목 또는 메시지 본문에 검색어가 포함된 대화만 남깁니다. */
export function filterThreads(threads: ChatThread[], query: string): ChatThread[] {
  const q = query.trim().toLowerCase();
  if (!q) return threads;
  return threads.filter(
    (thread) =>
      thread.title.toLowerCase().includes(q) ||
      thread.messages.some((m) => m.text.toLowerCase().includes(q)),
  );
}
