"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Pricing() {
  return (
    <section className="px-6 lg:px-40 py-20" id="pricing">
      <div className="max-w-[1280px] mx-auto text-center">
        <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
          Pricing
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-[#4d6599] dark:text-gray-400 max-w-[600px] mx-auto mb-14">
          Start free with 3 AI uses. Upgrade to Pro for unlimited access to all features.
        </p>

        {/* 2-Column Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[750px] mx-auto mb-14">
          {/* Free */}
          <div className="p-8 bg-white dark:bg-[#1c2231] rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col text-left">
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

            <Button variant="secondary" className="w-full h-11" asChild>
              <Link href="/signup">Get Started Free</Link>
            </Button>
          </div>

          {/* Pro (highlighted) */}
          <div className="p-8 bg-white dark:bg-[#1c2231] rounded-2xl border-2 border-primary shadow-lg shadow-primary/10 flex flex-col text-left relative">
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

            <Button className="w-full h-11" asChild>
              <Link href="/signup?plan=premium">Upgrade to Pro</Link>
            </Button>
          </div>
        </div>

        <p className="text-sm text-[#4d6599] dark:text-gray-400 mt-10 flex items-center justify-center gap-2">
          <span
            className="material-symbols-outlined text-green-500 text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified
          </span>
          Secure payments by Stripe. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
