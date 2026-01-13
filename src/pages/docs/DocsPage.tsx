import { useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import DocsSidebar from "./DocsSidebar";
import DocsTOC from "./DocsTOC";
import QuickStart from "./contents/QuickStart";
import Installation from "./contents/Installation";
import JavaScriptAPI from "./contents/JavaScriptAPI";
import Customization from "./contents/Customization";
import Examples from "./contents/Examples";
import Advanced from "./contents/Advanced";
import Security from "./contents/Security";
import FAQ from "./contents/FAQ";

export default function DocsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-white lg:flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <DocsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentPath={location.pathname}
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0 xl:flex xl:gap-8">
        <div className="flex-1 min-w-0">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-16 z-30 bg-white border-b border-gray-200 px-4 py-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <span className="font-semibold">문서</span>
            </button>
          </div>

          {/* Content Area */}
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            <Routes>
              <Route path="quick-start" element={<QuickStart />} />
              <Route path="installation" element={<Installation />} />
              <Route path="api/javascript" element={<JavaScriptAPI />} />
              <Route path="customization" element={<Customization />} />
              <Route path="examples" element={<Examples />} />
              <Route path="advanced" element={<Advanced />} />
              <Route path="security" element={<Security />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="" element={<Navigate to="quick-start" replace />} />
              <Route path="*" element={<Navigate to="quick-start" replace />} />
            </Routes>
          </main>
        </div>

        {/* Table of Contents */}
        <DocsTOC key={location.pathname} />
      </div>
    </div>
  );
}
