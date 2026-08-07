import {
  AcademicIcon,
  BoltIcon,
  BookIcon,
  BuildingIcon,
  DocumentIcon,
  ShieldIcon,
} from "../../../components/Icons";
import type { OrganizationAvatarPresetId } from "./organizationAvatarPresets";

interface OrganizationAvatarPresetIconProps {
  presetId: OrganizationAvatarPresetId;
  className?: string;
}

const PRESET_ICONS = {
  "campus-red": BuildingIcon,
  "archive-amber": AcademicIcon,
  "library-green": BookIcon,
  "document-blue": DocumentIcon,
  "energy-violet": BoltIcon,
  "shield-slate": ShieldIcon,
};

export default function OrganizationAvatarPresetIcon({
  presetId,
  className,
}: OrganizationAvatarPresetIconProps) {
  const Icon = PRESET_ICONS[presetId];
  return <Icon className={className} />;
}
