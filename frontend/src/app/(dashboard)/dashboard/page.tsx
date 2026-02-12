"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { userApi } from "@/lib/api/client";
import type { UserStats } from "@/lib/api/client";

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

const gettingStartedSteps = [
  {
    key: "has_cv" as const,
    label: "Analyze your CV",
    description: "Upload your CV and get ATS feedback",
    href: "/dashboard/cv-optimizer",
    icon: "analytics",
  },
  {
    key: "has_letter" as const,
    label: "Generate a cover letter",
    description: "Create a personalized cover letter",
    href: "/dashboard/cover-letter",
    icon: "auto_fix_high",
  },
  {
    key: "has_photo" as const,
    label: "Enhance your photo",
    description: "Get a professional AI headshot",
    href: "/dashboard/photo",
    icon: "portrait",
  },
  {
    key: "has_application" as const,
    label: "Track an application",
    description: "Log your first job application",
    href: "/dashboard/applications",
    icon: "outgoing_mail",
  },
];

export default function DashboardPage() {
  const { user, profile, isPremium, freeUsesRemaining } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const displayName =
    profile?.displayName || user?.email?.split("@")[0] || "there";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await userApi.getStats();
        setStats(data);
      } catch {
        // silently fail
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const completedCount = stats
    ? [stats.completeness.has_cv, stats.completeness.has_photo, stats.completeness.has_letter, stats.completeness.has_application].filter(Boolean).length
    : 0;

  const allComplete = completedCount === 4;

  return (
    <>
      {/* Welcome */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-[#0e121b] dark:text-white text-3xl font-black tracking-tight">
            Welcome back, {displayName}
          </h2>
          <p className="text-[#4d6599] dark:text-gray-400 text-base">
            Here&apos;s an overview of your job search progress.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cv-optimizer">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Optimize CV
          </Link>
        </Button>
      </div>

      {/* Row 1: Profile Completeness + Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Completeness */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">task_alt</span>
                <h3 className="text-lg font-bold">Profile Completeness</h3>
              </div>
              <span className="text-sm font-bold text-primary">{completedCount}/4</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(completedCount / 4) * 100}%` }}
              />
            </div>

            {!allComplete ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gettingStartedSteps.map((step) => {
                  const isDone = stats?.completeness[step.key] ?? false;
                  return (
                    <Link
                      key={step.key}
                      href={step.href}
                      className={cn(
                        "p-3 rounded-lg border flex items-center gap-3 transition-colors",
                        isDone
                          ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10"
                          : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "size-9 rounded-full flex items-center justify-center flex-shrink-0",
                        isDone
                          ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                      )}>
                        <span className="material-symbols-outlined text-lg">
                          {isDone ? "check_circle" : step.icon}
                        </span>
                      </div>
                      <div>
                        <p className={cn("text-sm font-semibold", isDone && "line-through text-gray-400")}>
                          {step.label}
                        </p>
                        <p className="text-xs text-gray-500">{step.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <span className="material-symbols-outlined text-green-600 text-2xl">celebration</span>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  All set! Your profile is complete. Keep optimizing for each new application.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div
                className={cn(
                  "size-12 rounded-full flex items-center justify-center",
                  isPremium
                    ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600"
                    : "bg-blue-100 dark:bg-blue-900/20 text-primary"
                )}
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
                  <p className="text-xl font-black">{isPremium ? "Pro" : "Free"}</p>
                  {isPremium && <Badge variant="success">Active</Badge>}
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
            {!isPremium ? (
              <Button className="w-full" asChild>
                <Link href="/pricing">Upgrade to Pro</Link>
              </Button>
            ) : (
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/settings#subscription">Manage</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "CVs Analyzed",
            value: stats?.cv_count ?? 0,
            icon: "analytics",
            color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20",
          },
          {
            label: "Cover Letters",
            value: stats?.letter_count ?? 0,
            icon: "auto_fix_high",
            color: "text-purple-600 bg-purple-100 dark:bg-purple-900/20",
          },
          {
            label: "Applications",
            value: stats?.application_count ?? 0,
            icon: "outgoing_mail",
            color: "text-orange-600 bg-orange-100 dark:bg-orange-900/20",
          },
          {
            label: "Latest ATS Score",
            value: stats?.latest_cv_score != null ? `${stats.latest_cv_score}%` : "—",
            icon: "speed",
            color: "text-green-600 bg-green-100 dark:bg-green-900/20",
          },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn("size-10 rounded-lg flex items-center justify-center", card.color)}>
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                  <p className="text-2xl font-black">
                    {loadingStats ? "..." : card.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 3: Quick Actions + AI Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
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
                <Link href="/dashboard/cv-optimizer">
                  <span className="material-symbols-outlined text-sm">analytics</span>
                  Analyze CV with ATS
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/dashboard/cover-letter">
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
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/dashboard/applications">
                  <span className="material-symbols-outlined text-sm">outgoing_mail</span>
                  Track Application
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
