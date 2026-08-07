interface OrganizationAvatarProps {
  organizationKey: string;
  organizationName: string;
  className?: string;
}

const AVATAR_COLOR_CLASSES = [
  "bg-red-100 text-red-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-slate-200 text-slate-700",
] as const;

function getStableColorClasses(organizationKey: string): string {
  const hash = Array.from(organizationKey).reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
  return AVATAR_COLOR_CLASSES[hash % AVATAR_COLOR_CLASSES.length];
}

function getOrganizationInitial(organizationName: string): string {
  return Array.from(organizationName.trim())[0]?.toUpperCase() ?? "?";
}

export default function OrganizationAvatar({
  organizationKey,
  organizationName,
  className = "h-9 w-9",
}: OrganizationAvatarProps) {
  const colorClasses = getStableColorClasses(organizationKey);
  const initial = getOrganizationInitial(organizationName);

  return (
    <span
      role="img"
      aria-label={`${organizationName} 조직`}
      className={`flex shrink-0 items-center justify-center rounded-md text-sm font-semibold ${colorClasses} ${className}`}
    >
      {initial}
    </span>
  );
}
