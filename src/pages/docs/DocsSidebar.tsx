import { Link } from "react-router-dom";
import { XIcon } from "../../components/Icons";

interface NavItem {
  title: string;
  path: string;
  children?: NavItem[];
}

interface DocsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
}

const navItems: NavItem[] = [
  {
    title: "Quick Start",
    path: "/docs/quick-start",
  },
  {
    title: "Installation",
    path: "/docs/installation",
  },
  {
    title: "API Reference",
    path: "/docs/api/javascript",
    children: [
      {
        title: "JavaScript API",
        path: "/docs/api/javascript",
      },
    ],
  },
  {
    title: "Customization",
    path: "/docs/customization",
  },
  {
    title: "Examples",
    path: "/docs/examples",
  },
  {
    title: "Advanced",
    path: "/docs/advanced",
  },
  {
    title: "Security",
    path: "/docs/security",
  },
  {
    title: "FAQ",
    path: "/docs/faq",
  },
];

export default function DocsSidebar({
  isOpen,
  onClose,
  currentPath,
}: DocsSidebarProps) {
  const isActive = (path: string) => currentPath === path;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-200 bg-white z-30">
          <nav className="w-full p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? "bg-[#df3326]/10 text-[#df3326]"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {item.title}
                  </Link>
                  {item.children && (
                    <ul className="mt-1 ml-4 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <Link
                            to={child.path}
                            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                              isActive(child.path)
                                ? "bg-[#df3326]/10 text-[#df3326] font-medium"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                          >
                            {child.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">문서</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <nav
          className="p-4 overflow-y-auto"
          style={{ height: "calc(100vh - 4rem - 4rem)" }}
        >
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-[#df3326]/10 text-[#df3326]"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {item.title}
                </Link>
                {item.children && (
                  <ul className="mt-1 ml-4 space-y-1">
                    {item.children.map((child) => (
                      <li key={child.path}>
                        <Link
                          to={child.path}
                          onClick={onClose}
                          className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive(child.path)
                              ? "bg-[#df3326]/10 text-[#df3326] font-medium"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          {child.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
