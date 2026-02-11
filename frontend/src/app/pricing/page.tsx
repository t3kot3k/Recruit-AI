"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewAccount = searchParams.get("new") === "true";

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
      <Header />
      <main className="flex-1 flex flex-col items-center px-6 py-20">
        {/* Success Banner */}
        {isNewAccount && (
          <div className="w-full max-w-[900px] mb-8">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">
                check_circle
              </span>
              <div>
                <p className="text-green-800 dark:text-green-300 font-semibold text-sm">
                  Account created successfully! You have 3 free AI uses.
                </p>
                <p className="text-green-600 dark:text-green-400 text-xs">
                  Start for free or upgrade to Pro for unlimited access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Heading */}
        <div className="text-center mb-14">
          <h1 className="text-[#0e121b] dark:text-white text-4xl font-bold tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-[#4d6599] dark:text-gray-400 text-lg max-w-lg mx-auto">
            Start free with 3 AI uses. Upgrade to Pro for unlimited access to all features.
          </p>
        </div>

        {/* 2-Column Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[750px] w-full mb-14">
          {/* Free */}
          <div className="p-8 bg-white dark:bg-[#1c2231] rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col">
            <p className="text-sm font-bold text-[#4d6599] uppercase tracking-wider mb-2">
              Free
            </p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black text-[#0e121b] dark:text-white">
                $0
              </span>
            </div>
            <p className="text-sm text-[#4d6599] mb-6">
              3 free AI uses included
            </p>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                "3 AI uses (cover letters, headshots...)",
                "ATS CV analysis (always free)",
                "Email tracking (always free)",
                "Full analysis results",
              ].map((text) => (
                <li key={text} className="flex items-start gap-2.5 text-sm">
                  <span className="material-symbols-outlined text-green-500 text-base mt-0.5">
                    check_circle
                  </span>
                  <span className="text-[#0e121b] dark:text-gray-200">{text}</span>
                </li>
              ))}
            </ul>

            <Button
              variant="secondary"
              className="w-full h-12"
              onClick={() => router.push("/dashboard")}
            >
              Get Started Free
            </Button>
          </div>

          {/* Pro (highlighted) */}
          <div className="p-8 bg-white dark:bg-[#1c2231] rounded-2xl border-2 border-primary shadow-xl shadow-primary/10 flex flex-col relative">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white text-[11px] font-bold px-4 py-1 rounded-full uppercase tracking-wide">
              Best Value
            </span>
            <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
              Pro
            </p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black text-[#0e121b] dark:text-white">
                $19
              </span>
              <span className="text-gray-400 text-sm">/mo</span>
            </div>
            <p className="text-sm text-[#4d6599] mb-6">
              Everything unlimited
            </p>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                "Unlimited CV optimization",
                "Unlimited cover letter generation",
                "Unlimited AI headshots",
                "Unlimited downloads & emails",
                "Priority support",
                "Cancel anytime",
              ].map((text) => (
                <li key={text} className="flex items-start gap-2.5 text-sm">
                  <span className="material-symbols-outlined text-primary text-base mt-0.5">
                    check_circle
                  </span>
                  <span className="text-[#0e121b] dark:text-gray-200">{text}</span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full h-12"
              onClick={() => router.push("/dashboard/settings#subscription")}
            >
              Upgrade to Pro
            </Button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-6 text-xs text-[#4d6599] dark:text-gray-500">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">lock</span>
            Secure Checkout
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">credit_card</span>
            Powered by Stripe
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">event_available</span>
            Cancel Anytime
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}
