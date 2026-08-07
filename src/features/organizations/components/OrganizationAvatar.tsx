import OrganizationAvatarPresetIcon from "./OrganizationAvatarPresetIcon";
import {
  getDefaultOrganizationAvatarPresetId,
  ORGANIZATION_AVATAR_PRESETS,
  type OrganizationAvatarPresetId,
} from "./organizationAvatarPresets";

interface OrganizationAvatarProps {
  organizationKey: string;
  organizationName: string;
  presetId?: OrganizationAvatarPresetId;
  className?: string;
  iconClassName?: string;
}

export default function OrganizationAvatar({
  organizationKey,
  organizationName,
  presetId,
  className = "h-9 w-9",
  iconClassName = "h-4 w-4",
}: OrganizationAvatarProps) {
  const resolvedPresetId =
    presetId ?? getDefaultOrganizationAvatarPresetId(organizationKey);
  const preset =
    ORGANIZATION_AVATAR_PRESETS.find(
      (candidate) => candidate.id === resolvedPresetId,
    ) ?? ORGANIZATION_AVATAR_PRESETS[0];

  return (
    <span
      role="img"
      aria-label={`${organizationName} 조직 이미지: ${preset.label}`}
      className={`flex shrink-0 items-center justify-center rounded-md ${preset.colorClasses} ${className}`}
    >
      <OrganizationAvatarPresetIcon
        presetId={preset.id}
        className={iconClassName}
      />
    </span>
  );
}
