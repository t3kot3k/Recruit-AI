"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/dashboard/cv-optimizer", icon: "description", label: "CV Optimizer" },
  { href: "/dashboard/cover-letter", icon: "auto_fix_high", label: "Cover Letter" },
  { href: "/dashboard/applications", icon: "outgoing_mail", label: "Applications" },
  { href: "/dashboard/photo", icon: "portrait", label: "Photo Studio" },
  { href: "/dashboard/settings", icon: "settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, profile, isPremium, freeUsesRemaining, signOut } = useAuth();

  const getInitials = () => {
    if (profile?.displayName) {
      return profile.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <aside className="w-64 border-r border-[#e7ebf3] dark:border-gray-800 bg-white dark:bg-background-dark flex flex-col justify-between p-4 h-screen sticky top-0">
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 px-2">
          <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[#0e121b] dark:text-white text-base font-bold leading-tight">
              Recruit AI
            </h1>
            <p className="text-[#4d6599] dark:text-gray-400 text-xs font-normal">
              AI Career Suite
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-[#e7ebf3] dark:bg-gray-800 text-[#0e121b] dark:text-white"
                    : "text-[#4d6599] hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <span
                  className={cn(
                    "material-symbols-outlined",
                    isActive && "text-primary"
                  )}
                >
                  {item.icon}
                </span>
                <p className={cn("text-sm", isActive ? "font-semibold" : "font-medium")}>
                  {item.label}
                </p>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profile Mini */}
      <div className="border-t border-[#e7ebf3] dark:border-gray-800 pt-4">
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="rounded-full size-10 object-cover"
            />
          ) : (
            <div className="bg-primary/20 rounded-full size-10 flex items-center justify-center text-primary font-bold">
              {getInitials()}
            </div>
          )}
          <div className="flex flex-col overflow-hidden flex-1">
            <p className="text-sm font-bold truncate">
              {profile?.displayName || user?.email?.split("@")[0] || "User"}
            </p>
            <p className="text-xs text-[#4d6599] truncate">
              {isPremium ? (
                <span className="font-semibold text-primary">Pro</span>
              ) : (
                <>Free &middot; {freeUsesRemaining} use{freeUsesRemaining !== 1 ? "s" : ""} left</>
              )}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="text-[#4d6599] hover:text-red-500 transition-colors"
            title="Sign out"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
