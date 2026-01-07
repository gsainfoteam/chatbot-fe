// 채팅 관련 API 함수 (React Query 훅 포함)

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { ChatRequest, ChatResponse } from "./types";

// 일반 함수
export async function sendChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  const response = await apiClient.post<ChatResponse>("/chat", request);
  return response.data;
}

export async function createChatSession(
  widgetKey: string,
  pageUrl?: string
): Promise<{ sessionId: string }> {
  const response = await apiClient.post<{ sessionId: string }>(
    "/chat/session",
    { widgetKey, pageUrl }
  );
  return response.data;
}

// React Query 훅
export function useSendChatMessage() {
  return useMutation({
    mutationFn: sendChatMessage,
  });
}

export function useCreateChatSession() {
  return useMutation({
    mutationFn: ({
      widgetKey,
      pageUrl,
    }: {
      widgetKey: string;
      pageUrl?: string;
    }) => createChatSession(widgetKey, pageUrl),
  });
}
