"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#compare", label: "Why Recruit AI" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#pricing", label: "Pricing" },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-solid border-[#e7ebf3] dark:border-[#2d364d] px-6 lg:px-40 py-3">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between whitespace-nowrap">
        <Logo />

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 justify-end gap-8">
          <nav className="flex items-center gap-9">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined text-2xl">
            {isMobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden absolute top-full left-0 right-0 bg-white dark:bg-background-dark border-b border-[#e7ebf3] dark:border-[#2d364d] transition-all duration-300 overflow-hidden",
          isMobileMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-6 py-4 space-y-4">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium hover:text-primary transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-3 pt-4 border-t border-[#e7ebf3] dark:border-[#2d364d]">
            <Button asChild className="w-full">
              <Link href="/signup">Sign Up</Link>
            </Button>
            <Button variant="secondary" asChild className="w-full">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
