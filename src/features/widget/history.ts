import type { ChatMessage } from "./types.ts";

export interface HistoryTarget {
  userId?: string;
  assistantId: string;
  question?: string;
  answer?: string;
  regeneratedFromMessageId?: string;
  previousIds: Set<string>;
}

/** 문장만으로 최신 답변을 붙이지 않는다. 요청 전 ID 집합과 질문/재생성 관계를 함께 확인한다. */
export function reconcileHistory(
  local: ChatMessage[],
  chronological: ChatMessage[],
  target?: HistoryTarget,
): ChatMessage[] {
  const bindings = new Map<string, ChatMessage>();
  if (target) {
    const fresh = chronological.filter(
      (m) => m.serverId && !target.previousIds.has(m.serverId),
    );
    const users = fresh.filter(
      (m) => m.role === "user" && m.text === target.question,
    );
    const user = users.length === 1 ? users[0] : undefined;
    if (user && target.userId) bindings.set(target.userId, user);
    const answers = fresh.filter((m) => {
      if (m.role !== "assistant" || !target.answer || m.text !== target.answer)
        return false;
      if (target.regeneratedFromMessageId)
        return m.regeneratedFromMessageId === target.regeneratedFromMessageId;
      if (!user) return false;
      const index = chronological.indexOf(m);
      const precedingUser = chronological
        .slice(0, index)
        .reverse()
        .find((item) => item.role === "user");
      return precedingUser?.serverId === user.serverId && !m.regeneratedAnswer;
    });
    if (answers.length === 1) bindings.set(target.assistantId, answers[0]);
  }
  const byId = new Map(chronological.map((m) => [m.serverId, m]));
  const merged = local.map((m) => {
    const saved =
      (m.serverId ? byId.get(m.serverId) : undefined) ?? bindings.get(m.id);
    return saved
      ? {
          ...m,
          ...saved,
          id: m.id,
          regenerationAttempted: m.regenerationAttempted,
          notice: undefined,
        }
      : m;
  });
  const attached = new Set(merged.map((m) => m.serverId));
  for (const saved of chronological) {
    if (!attached.has(saved.serverId)) merged.push(saved);
  }
  const regeneratedIds = new Set(
    chronological.map((m) => m.regeneratedFromMessageId).filter(Boolean),
  );
  return merged.map((m) =>
    m.serverId && regeneratedIds.has(m.serverId)
      ? { ...m, regenerationAttempted: true }
      : m,
  );
}
