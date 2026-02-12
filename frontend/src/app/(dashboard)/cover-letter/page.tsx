"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { coverLetterApi, subscriptionApi } from "@/lib/api/client";
import type { CoverLetterResponse, CoverLetterListItem } from "@/lib/api/client";
import { useCVStore } from "@/stores/cv-store";

const tones = [
  { id: "classic", label: "Classic" },
  { id: "startup", label: "Startup" },
  { id: "corporate", label: "Corporate" },
] as const;

type Tone = (typeof tones)[number]["id"];

export default function CoverLetterPage() {
  const { isPremium, freeUsesRemaining } = useAuth();

  // Shared state from CV store
  const storeJobTitle = useCVStore((s) => s.jobTitle);
  const storeCompanyName = useCVStore((s) => s.companyName);
  const storeJobDescription = useCVStore((s) => s.jobDescription);

  // Local form state
  const [jobTitle, setJobTitle] = useState(storeJobTitle);
  const [companyName, setCompanyName] = useState(storeCompanyName);
  const [jobDescription, setJobDescription] = useState(storeJobDescription);
  const [selectedTone, setSelectedTone] = useState<Tone>("classic");
  const [additionalContext, setAdditionalContext] = useState("");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<CoverLetterResponse | null>(null);
  const [editableContent, setEditableContent] = useState("");
  const [error, setError] = useState("");

  // History
  const [history, setHistory] = useState<CoverLetterListItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // Sync from store when it changes
  useEffect(() => {
    if (storeJobTitle) setJobTitle(storeJobTitle);
    if (storeCompanyName) setCompanyName(storeCompanyName);
    if (storeJobDescription) setJobDescription(storeJobDescription);
  }, [storeJobTitle, storeCompanyName, storeJobDescription]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const letters = await coverLetterApi.getAll();
      setHistory(letters);
    } catch {
      // silently fail
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    if (!isPremium && freeUsesRemaining <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    if (!jobTitle.trim() || !companyName.trim() || !jobDescription.trim()) {
      setError("Please fill in job title, company name, and job description.");
      return;
    }

    setError("");
    setGenerating(true);
    try {
      const result = await coverLetterApi.generate({
        job_title: jobTitle,
        company_name: companyName,
        job_description: jobDescription,
        tone: selectedTone,
        additional_context: additionalContext || undefined,
      });
      setGeneratedLetter(result);
      setEditableContent(result.content);
      loadHistory();
    } catch (err) {
      if (err instanceof Error && "status" in err && (err as { status: number }).status === 402) {
        setShowUpgradeModal(true);
      } else {
        setError("Failed to generate cover letter. Please try again.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleLoadFromHistory = async (id: string) => {
    try {
      const letter = await coverLetterApi.get(id);
      setGeneratedLetter(letter);
      setEditableContent(letter.content);
      setJobTitle(letter.job_title);
      setCompanyName(letter.company_name);
      setSelectedTone(letter.tone as Tone);
    } catch {
      // silently fail
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editableContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const response = await subscriptionApi.createCheckout(
        `${window.location.origin}/dashboard/cover-letter?subscription=success`,
        window.location.href
      );
      window.location.href = response.checkout_url;
    } catch {
      setSubscribing(false);
    }
  };

  return (
    <>
      {/* Page Heading */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Cover Letter Generator
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Generate personalized cover letters tailored to each job application.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">auto_fix_high</span>
                <CardTitle>Job Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Job Title"
                placeholder="e.g. Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
              <Input
                label="Company Name"
                placeholder="e.g. Google"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <Textarea
                label="Job Description"
                placeholder="Paste the full job advertisement here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[140px]"
              />
              <Textarea
                label="Additional Context (optional)"
                placeholder="Specific achievements or skills you want to highlight..."
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                className="min-h-[80px]"
              />

              {/* Tone Selection */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Select Tone
                </p>
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {tones.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => setSelectedTone(tone.id)}
                      className={cn(
                        "py-2 px-3 text-xs font-bold rounded-md transition-colors",
                        selectedTone === tone.id
                          ? "bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-primary"
                          : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </p>
              )}

              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={generating}
                isLoading={generating}
              >
                <span className="material-symbols-outlined text-xl">magic_button</span>
                Generate Letter
              </Button>

              {!isPremium && (
                <p className="text-xs text-center text-gray-400">
                  {freeUsesRemaining} free AI use{freeUsesRemaining !== 1 ? "s" : ""} remaining
                </p>
              )}
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Letters</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-gray-400">No letters yet. Generate your first one!</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleLoadFromHistory(item.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-colors hover:border-primary/50",
                        generatedLetter?.id === item.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 dark:border-gray-700"
                      )}
                    >
                      <p className="text-sm font-medium truncate">{item.job_title}</p>
                      <p className="text-xs text-gray-500 truncate">{item.company_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {item.tone}
                        </Badge>
                        <span className="text-[10px] text-gray-400">
                          {item.word_count} words
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Output */}
        <div className="lg:col-span-2">
          <Card className="flex flex-col min-h-[700px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">description</span>
                  <CardTitle>Generated Output</CardTitle>
                </div>
                {editableContent && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleCopy}
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {copied ? "check" : "content_copy"}
                      </span>
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {generating ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm text-gray-500">Generating your personalized cover letter...</p>
                  </div>
                </div>
              ) : editableContent ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {generatedLetter && (
                        <>
                          <Badge variant="secondary">{generatedLetter.tone}</Badge>
                          <span className="text-xs text-gray-400">
                            {generatedLetter.word_count} words
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Optimized for ATS
                    </div>
                  </div>
                  <textarea
                    className="w-full flex-1 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 focus:ring-primary focus:border-primary text-sm p-6 leading-relaxed text-gray-700 dark:text-gray-300 resize-none min-h-[500px]"
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    spellCheck={false}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">
                      auto_fix_high
                    </span>
                    <p className="text-gray-400 text-sm">
                      Fill in the job details and click &quot;Generate Letter&quot; to create a personalized cover letter.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#1c2231] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-primary text-3xl">
                  workspace_premium
                </span>
              </div>
              <h3 className="text-xl font-bold">Upgrade to Pro</h3>
              <p className="text-sm text-gray-500">
                You&apos;ve used all your free AI uses. Upgrade to Pro for unlimited access to all AI features.
              </p>
              <p className="text-3xl font-black">
                $19<span className="text-base font-normal text-gray-400">/month</span>
              </p>
              <ul className="text-sm text-left space-y-2">
                {[
                  "Unlimited cover letter generation",
                  "Unlimited CV optimization",
                  "Unlimited AI headshots",
                  "Cancel anytime",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-500 text-sm">
                      check_circle
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowUpgradeModal(false)}
                >
                  Maybe Later
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  isLoading={subscribing}
                >
                  Go Pro
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
