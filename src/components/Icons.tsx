interface IconProps {
  className?: string;
}

const createIcon = (
  viewBox: string,
  paths: string[],
  defaultClassName?: string,
) => {
  return ({ className = defaultClassName }: IconProps) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox={viewBox}
    >
      {paths.map((path, index) => (
        <path
          key={index}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={path}
        />
      ))}
    </svg>
  );
};

const createIconWithFill = (
  viewBox: string,
  paths: string[],
  defaultClassName?: string,
) => {
  return ({ className = defaultClassName }: IconProps) => (
    <svg className={className} viewBox={viewBox} fill="none">
      {paths.map((path, index) => (
        <path
          key={index}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          d={path}
        />
      ))}
    </svg>
  );
};

export const ClipboardIcon = createIcon(
  "0 0 24 24",
  [
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  ],
  "w-4 h-4 sm:w-5 sm:h-5",
);

export const AcademicIcon = createIcon(
  "0 0 24 24",
  [
    "M12 14l9-5-9-5-9 5 9 5z",
    "M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z",
    "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222",
  ],
  "w-4 h-4 sm:w-5 sm:h-5",
);

export const BookIcon = createIcon(
  "0 0 24 24",
  [
    "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  ],
  "w-4 h-4 sm:w-5 sm:h-5",
);

export const BuildingIcon = createIcon(
  "0 0 24 24",
  [
    "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  ],
  "w-4 h-4 sm:w-5 sm:h-5",
);

export const BoltIcon = createIcon(
  "0 0 24 24",
  ["M13 10V3L4 14h7v7l9-11h-7z"],
  "w-7 h-7 sm:w-8 sm:h-8",
);

export const CheckCircleIcon = createIconWithFill(
  "0 0 24 24",
  [
    "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  ],
  "w-7 h-7 sm:w-8 sm:h-8",
);

export const ChatIcon = createIcon(
  "0 0 24 24",
  [
    "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  ],
  "w-7 h-7 sm:w-8 sm:h-8",
);

export const ShieldIcon = createIcon(
  "0 0 24 24",
  [
    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  ],
  "w-7 h-7 sm:w-8 sm:h-8",
);

export const PaletteIcon = createIcon(
  "0 0 24 24",
  [
    "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
  ],
  "w-7 h-7 sm:w-8 sm:h-8",
);

export const CodeIcon = createIcon(
  "0 0 24 24",
  ["M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"],
  "w-7 h-7 sm:w-8 sm:h-8",
);

export const LockIcon = createIcon(
  "0 0 24 24",
  [
    "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  ],
  "w-7 h-7 sm:w-8 sm:h-8",
);

export const DocumentIcon = createIcon(
  "0 0 24 24",
  [
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  ],
  "w-7 h-7 sm:w-8 sm:h-8",
);

export const LinkIcon = createIcon(
  "0 0 24 24",
  [
    "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
  ],
  "w-3 h-3",
);

export const ExternalLinkIcon = createIcon(
  "0 0 24 24",
  [
    "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14",
  ],
  "w-3 h-3",
);

export const PhotoIcon = createIcon(
  "0 0 24 24",
  [
    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  ],
  "w-3 h-3",
);

export const KeyIcon = createIcon(
  "0 0 24 24",
  [
    "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
  ],
  "w-4 h-4",
);

export const ChartBarIcon = createIcon(
  "0 0 24 24",
  [
    "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  ],
  "w-4 h-4",
);

export const MenuIcon = createIcon(
  "0 0 24 24",
  ["M4 6h16M4 12h16M4 18h16"],
  "w-6 h-6",
);

export const EllipsisVerticalIcon = ({
  className = "w-5 h-5",
}: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <circle cx="12" cy="6" r="1.4" />
    <circle cx="12" cy="12" r="1.4" />
    <circle cx="12" cy="18" r="1.4" />
  </svg>
);

export const EyeIcon = createIcon(
  "0 0 24 24",
  [
    "M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z",
    "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  ],
  "w-5 h-5",
);

export const CalendarIcon = createIcon(
  "0 0 24 24",
  [
    "M6.75 3v2.25M17.25 3v2.25M3.75 9h16.5",
    "M5.25 5.25h13.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-12a1.5 1.5 0 011.5-1.5z",
  ],
  "w-5 h-5",
);

export const ClockIcon = createIcon(
  "0 0 24 24",
  ["M12 6v6l4 2", "M21 12a9 9 0 11-18 0 9 9 0 0118 0z"],
  "w-4 h-4",
);

export const TrashIcon = createIcon(
  "0 0 24 24",
  [
    "M3 6h18",
    "M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6",
    "M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2",
    "M10 11v6M14 11v6",
  ],
  "w-5 h-5",
);

export const XIcon = createIcon(
  "0 0 24 24",
  ["M6 18L18 6M6 6l12 12"],
  "w-6 h-6",
);

export const ChevronDownIcon = createIcon(
  "0 0 24 24",
  ["M19 9l-7 7-7-7"],
  "w-4 h-4",
);

// 파일 업로드 (ArrowUpTray 스타일)
export const UploadIcon = createIcon(
  "0 0 24 24",
  [
    "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5",
  ],
  "w-4 h-4",
);

export const RefreshIcon = createIcon(
  "0 0 24 24",
  [
    "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  ],
  "w-4 h-4",
);

export const ShareIcon = createIcon(
  "0 0 24 24",
  [
    "M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z",
  ],
  "w-5 h-5",
);

export const TransferIcon = createIcon(
  "0 0 24 24",
  [
    "M7.5 3.75 3.75 7.5m0 0 3.75 3.75M3.75 7.5h13.5a3 3 0 013 3v.75",
    "M16.5 20.25l3.75-3.75m0 0-3.75-3.75m3.75 3.75H6.75a3 3 0 01-3-3v-.75",
  ],
  "w-5 h-5",
);

// 위쪽 화살표 (전송 등, 굵은 선)
export const ArrowUpIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      d="M5 10l7-7m0 0l7 7m-7-7v18"
    />
  </svg>
);

// 정보 안내 (아웃라인 원 + 정보 아이콘)
export const InfoIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10" strokeWidth={2} />
    <line
      x1="12"
      y1="16"
      x2="12"
      y2="12"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <line
      x1="12"
      y1="8"
      x2="12.01"
      y2="8"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </svg>
);

// 중지 (스트리밍 중단용, 둥근 사각형)
export const StopIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="3" ry="3" />
  </svg>
);

// 경고 (삼각형 + 느낌표)
export const ExclamationTriangleIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

// 신고 (깃발 - report 용도로 널리 쓰이는 아이콘)
export const FlagIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
    />
  </svg>
);

// 답변 피드백 (도움이 됐어요)
export const ThumbsUpIcon = createIcon("0 0 24 24", [
  "M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3",
]);

// 답변 피드백 (도움이 안 됐어요)
export const ThumbsDownIcon = createIcon("0 0 24 24", [
  "M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17",
]);
