"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/feed",
      label: "Home",
      testId: "nav-home",
      icon: (active: boolean) => (
        <svg
          className="w-6 h-6"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={active ? 0 : 2}
          viewBox="0 0 24 24"
        >
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: "/upload",
      label: "Upload",
      testId: "nav-upload",
      icon: () => (
        <div className="w-10 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 4v16m8-8H4"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      ),
    },
    {
      href: "/profile/me",
      label: "Profile",
      testId: "nav-profile",
      icon: (active: boolean) => (
        <svg
          className="w-6 h-6"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={active ? 0 : 2}
          viewBox="0 0 24 24"
        >
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      data-testid="nav-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 border-t border-gray-800
                 backdrop-blur-lg"
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={item.testId}
              className={`flex flex-col items-center gap-0.5 px-4 py-1
                         transition-colors ${isActive ? "text-white" : "text-gray-500"}`}
            >
              {item.icon(isActive)}
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
