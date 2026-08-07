import { Link } from "react-router-dom";
import { UploadIcon } from "../../../components/Icons";

interface DocumentManagementNavItemProps {
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}

export default function DocumentManagementNavItem({
  variant,
  onNavigate,
}: DocumentManagementNavItemProps) {
  if (variant === "desktop") {
    return (
      <Link
        to="/upload"
        className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
      >
        <UploadIcon className="h-4 w-4" />
        문서 관리
      </Link>
    );
  }

  return (
    <Link
      to="/upload"
      onClick={onNavigate}
      className="flex w-full items-center justify-start gap-2 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
    >
      <UploadIcon className="h-4 w-4" />
      문서 관리
    </Link>
  );
}
