export type OrganizationAvatarPresetId =
  | "campus-red"
  | "archive-amber"
  | "library-green"
  | "document-blue"
  | "energy-violet"
  | "shield-slate";

interface OrganizationAvatarPreset {
  id: OrganizationAvatarPresetId;
  label: string;
  colorClasses: string;
}

export const ORGANIZATION_AVATAR_PRESETS: OrganizationAvatarPreset[] = [
  {
    id: "campus-red",
    label: "캠퍼스 레드",
    colorClasses: "bg-red-100 text-red-700",
  },
  {
    id: "archive-amber",
    label: "아카이브 앰버",
    colorClasses: "bg-amber-100 text-amber-700",
  },
  {
    id: "library-green",
    label: "라이브러리 그린",
    colorClasses: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "document-blue",
    label: "도큐먼트 블루",
    colorClasses: "bg-sky-100 text-sky-700",
  },
  {
    id: "energy-violet",
    label: "에너지 바이올렛",
    colorClasses: "bg-violet-100 text-violet-700",
  },
  {
    id: "shield-slate",
    label: "쉴드 슬레이트",
    colorClasses: "bg-slate-200 text-slate-700",
  },
];

export type OrganizationAvatarPresetMap = Record<
  string,
  OrganizationAvatarPresetId
>;

const STORAGE_KEY = "gist-chatbot:organization-avatar-presets";

function isPresetId(value: unknown): value is OrganizationAvatarPresetId {
  return ORGANIZATION_AVATAR_PRESETS.some((preset) => preset.id === value);
}

export function loadOrganizationAvatarPresets(): OrganizationAvatarPresetMap {
  if (typeof window === "undefined") return {};
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
      return {};
    }
    const presets: OrganizationAvatarPresetMap = {};
    Object.entries(stored).forEach(([organizationId, presetId]) => {
      if (isPresetId(presetId)) presets[organizationId] = presetId;
    });
    return presets;
  } catch {
    return {};
  }
}

export function saveOrganizationAvatarPresets(
  presets: OrganizationAvatarPresetMap,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // 저장 공간이 제한된 환경에서도 조직 생성과 탐색은 계속 동작합니다.
  }
}

export function getDefaultOrganizationAvatarPresetId(
  organizationKey: string,
): OrganizationAvatarPresetId {
  const hash = Array.from(organizationKey).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return ORGANIZATION_AVATAR_PRESETS[
    hash % ORGANIZATION_AVATAR_PRESETS.length
  ].id;
}
