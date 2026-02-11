"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";

const aiTips = [
  {
    category: "CV Optimization",
    tip: "Ensure your skills section contains keywords directly from the job description for ATS.",
  },
  {
    category: "Photography",
    tip: "Use a neutral background for headshots to keep the focus on your professional presence.",
  },
  {
    category: "Cover Letters",
    tip: "Address the hiring manager by name to show you've done your research.",
  },
];

export default function DashboardPage() {
  const { user, profile, isPremium, freeUsesRemaining } = useAuth();

  const displayName =
    profile?.displayName || user?.email?.split("@")[0] || "there";

  return (
    <>
      {/* Page Heading */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-[#0e121b] dark:text-white text-3xl font-black tracking-tight">
            Welcome back, {displayName}
          </h2>
          <p className="text-[#4d6599] dark:text-gray-400 text-base">
            Here&apos;s an overview of your job search progress and AI assets.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cv-tools">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Create New Asset</span>
          </Link>
        </Button>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Status Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`size-12 rounded-full flex items-center justify-center ${
                  isPremium
                    ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600"
                    : "bg-blue-100 dark:bg-blue-900/20 text-primary"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[28px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {isPremium ? "workspace_premium" : "shield"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#4d6599]">Plan</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-black">
                    {isPremium ? "Pro" : "Free"}
                  </p>
                  {isPremium && (
                    <Badge variant="success">Active</Badge>
                  )}
                </div>
              </div>
            </div>
            {isPremium ? (
              <p className="text-sm text-[#4d6599] mb-3">Unlimited AI features</p>
            ) : (
              <p className="text-sm text-[#4d6599] mb-3">
                {freeUsesRemaining} free AI use{freeUsesRemaining !== 1 ? "s" : ""} remaining
              </p>
            )}
            {!isPremium && (
              <Button className="w-full" asChild>
                <Link href="/pricing">
                  Upgrade to Pro
                </Link>
              </Button>
            )}
            {isPremium && (
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/settings#subscription">
                  Manage Subscription
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <span
                className="material-symbols-outlined text-primary text-[28px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                rocket_launch
              </span>
              <h3 className="text-lg font-bold">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/dashboard/cv-tools">
                  <span className="material-symbols-outlined text-sm">analytics</span>
                  Analyze CV with ATS
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/dashboard/cv-tools">
                  <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                  Generate Cover Letter
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/dashboard/photo">
                  <span className="material-symbols-outlined text-sm">portrait</span>
                  AI Headshot
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">lightbulb</span>
              <h3 className="text-lg font-bold">Quick AI Tips</h3>
            </div>
            <div className="space-y-4 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
              {aiTips.map((tip, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-background-light dark:bg-gray-800/50 border border-transparent hover:border-primary/20 transition-all"
                >
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                    {tip.category}
                  </p>
                  <p className="text-sm text-[#0e121b] dark:text-gray-200 font-medium leading-snug">
                    {tip.tip}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
