interface IconProps {
  className?: string;
}

const createIcon = (
  viewBox: string,
  paths: string[],
  defaultClassName?: string
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
  defaultClassName?: string
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
  "w-4 h-4 sm:w-5 sm:h-5"
);

export const AcademicIcon = createIcon(
  "0 0 24 24",
  [
    "M12 14l9-5-9-5-9 5 9 5z",
    "M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z",
    "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222",
  ],
  "w-4 h-4 sm:w-5 sm:h-5"
);

export const BookIcon = createIcon(
  "0 0 24 24",
  [
    "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  ],
  "w-4 h-4 sm:w-5 sm:h-5"
);

export const BuildingIcon = createIcon(
  "0 0 24 24",
  [
    "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  ],
  "w-4 h-4 sm:w-5 sm:h-5"
);

export const BoltIcon = createIcon(
  "0 0 24 24",
  ["M13 10V3L4 14h7v7l9-11h-7z"],
  "w-7 h-7 sm:w-8 sm:h-8"
);

export const CheckCircleIcon = createIconWithFill(
  "0 0 24 24",
  [
    "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  ],
  "w-7 h-7 sm:w-8 sm:h-8"
);

export const ChatIcon = createIcon(
  "0 0 24 24",
  [
    "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  ],
  "w-7 h-7 sm:w-8 sm:h-8"
);

export const ShieldIcon = createIcon(
  "0 0 24 24",
  [
    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  ],
  "w-7 h-7 sm:w-8 sm:h-8"
);

export const PaletteIcon = createIcon(
  "0 0 24 24",
  [
    "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
  ],
  "w-7 h-7 sm:w-8 sm:h-8"
);

export const CodeIcon = createIcon(
  "0 0 24 24",
  ["M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"],
  "w-7 h-7 sm:w-8 sm:h-8"
);

export const LockIcon = createIcon(
  "0 0 24 24",
  [
    "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  ],
  "w-7 h-7 sm:w-8 sm:h-8"
);

export const DocumentIcon = createIcon(
  "0 0 24 24",
  [
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  ],
  "w-7 h-7 sm:w-8 sm:h-8"
);
