// 에이전트 진행 단계 표시 (SSE step 이벤트)

import { useState } from "react";
import {
  ChevronDown,
  CircleCheck,
  CircleMinus,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import type { AgentStep, AgentStepStatus } from "./types";

const RESEARCH_KIND = "research";

// 모델이 쓴 문장이라 끝 마침표가 있거나 없을 수 있어 통일
function formatThought(thought: string): string {
  return thought.trim().replace(/[.。]+$/, "");
}

function StepStatusIcon({
  status,
  resultCount,
}: {
  status: AgentStepStatus;
  resultCount?: number;
}) {
  const className = "w-3.5 h-3.5 shrink-0";
  switch (status) {
    case "running":
      return (
        <LoaderCircle
          className={`${className} animate-spin`}
          style={{ color: "var(--color-text-secondary, #94a3b8)" }}
          aria-label="진행 중"
        />
      );
    case "done":
      return (
        <CircleCheck
          className={className}
          style={{
            // 결과 없이 끝난 단계는 흐리게
            color:
              resultCount === 0
                ? "var(--color-text-secondary, #94a3b8)"
                : "var(--color-primary, #df3326)",
          }}
          aria-label="완료"
        />
      );
    case "failed":
      // 실패해도 답변은 계속 오므로 오류색 대신 경고색
      return (
        <TriangleAlert
          className={className}
          style={{ color: "#d97706" }}
          aria-label="실패"
        />
      );
    case "stopped":
      return (
        <CircleMinus
          className={className}
          style={{ color: "var(--color-text-secondary, #94a3b8)" }}
          aria-label="중단됨"
        />
      );
  }
}

function ToolStepList({ steps }: { steps: AgentStep[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {steps.map((step) => (
        <li
          key={step.id}
          className="flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <span className="mt-[2px]">
            <StepStatusIcon
              status={step.status}
              resultCount={step.resultCount}
            />
          </span>
          <div className="min-w-0 flex-1">
            <div
              className="text-[12.5px] leading-snug wrap-break-words"
              style={{ color: "var(--color-text, #1e293b)" }}
            >
              {step.label}
            </div>
            {step.thought && (
              <div
                className="mt-0.5 text-[11px] leading-snug wrap-break-words"
                style={{ color: "var(--color-text-secondary, #94a3b8)" }}
              >
                {formatThought(step.thought)}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ShimmerLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="loading-text-shimmer">{text}</span>
      <span
        className="flex items-center gap-1.5"
        style={{ color: "var(--color-text-secondary, #64748b)" }}
      >
        <span className="thinking-dot"></span>
        <span className="thinking-dot"></span>
        <span className="thinking-dot"></span>
      </span>
    </div>
  );
}

interface AgentStepsProps {
  steps: AgentStep[];
  // 답변 첫 조각이 오기 전 스트리밍 중이면 true (단계 목록을 펼쳐서 실시간 표시)
  live: boolean;
}

export default function AgentSteps({ steps, live }: AgentStepsProps) {
  const [expanded, setExpanded] = useState(false);

  const research = steps.find((s) => s.kind === RESEARCH_KIND);
  const toolSteps = steps.filter((s) => s.kind !== RESEARCH_KIND);

  if (live) {
    // research가 닫혔는데 아직 답변이 안 왔으면 답변 생성 대기 중
    const headerText =
      !research || research.status === "running"
        ? (research?.label ?? "자료를 더 찾아보고 있어요")
        : "답변을 정리하고 있어요";

    return (
      <div className="flex flex-col gap-2" aria-live="polite">
        <ShimmerLine text={headerText} />
        {toolSteps.length > 0 && <ToolStepList steps={toolSteps} />}
      </div>
    );
  }

  const summaryStatus =
    research?.status ??
    (steps.some((step) => step.status === "running")
      ? "running"
      : steps.some((step) => step.status === "stopped")
        ? "stopped"
        : steps.every((step) => step.status === "failed")
          ? "failed"
          : "done");
  const summaryIcon = (
    <StepStatusIcon
      status={summaryStatus}
      resultCount={research?.resultCount}
    />
  );
  // research가 failed면 서버 label이 running 문구("…찾아보고 있어요") 그대로라 요약 문구를 따로 둔다
  const summaryText =
    summaryStatus === "running"
      ? (research?.label ?? "자료를 더 찾아보고 있어요")
      : summaryStatus === "stopped"
        ? "자료 찾기를 중단했어요"
        : summaryStatus === "failed"
          ? "자료를 더 찾지 못했어요"
          : (research?.label ?? "자료를 찾아봤어요");

  const summary = (
    <>
      {summaryIcon}
      <span className="min-w-0 truncate">{summaryText}</span>
    </>
  );

  if (toolSteps.length === 0) {
    return (
      <div
        className="flex items-center gap-1.5 mb-1.5 text-[12px]"
        style={{ color: "var(--color-text-secondary, #64748b)" }}
      >
        {summary}
      </div>
    );
  }

  return (
    <div className="mb-1.5">
      <button
        type="button"
        className="flex items-center gap-1.5 max-w-full text-[12px] rounded-md transition hover:opacity-80 cursor-pointer"
        style={{ color: "var(--color-text-secondary, #64748b)" }}
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        {summary}
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      {expanded && (
        <div
          className="mt-2 mb-2.5 pl-2 border-l-2"
          style={{ borderLeftColor: "var(--color-border, #e2e8f0)" }}
        >
          <ToolStepList steps={toolSteps} />
        </div>
      )}
    </div>
  );
}
