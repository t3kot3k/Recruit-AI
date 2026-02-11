"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { subscriptionApi } from "@/lib/api/client";

const tones = [
  { id: "classic", label: "Classic" },
  { id: "startup", label: "Startup" },
  { id: "corporate", label: "Corporate" },
];

export default function CVToolsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [selectedTone, setSelectedTone] = useState("classic");
  const [isDragging, setIsDragging] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [coverLetter, setCoverLetter] = useState(`Dear Hiring Manager,

I am writing to express my enthusiastic interest in the [Role Name] position at [Company Name], as advertised. With a strong background in [Your Field] and a proven track record of [Key Achievement], I am confident that my skills align perfectly with the requirements of your team.

Throughout my career, I have focused on [Skill 1] and [Skill 2]. For example, in my previous role at [Previous Company], I successfully managed [Specific Task], which resulted in a [Percentage/Metric] improvement in [Outcome].

I am particularly impressed by [Company Name]'s commitment to [Company Value or Mission]. This resonates with my personal philosophy of [Your Philosophy]...

[Click 'Generate' to see the full AI-crafted version tailored to your CV and the job description.]

Best regards,
[Your Name]`);

  const { isPremium, freeUsesRemaining } = useAuth();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleOptimize = () => {
    // ATS analysis is always free — no gate needed
    // TODO: call cvApi.analyze() here
    console.log("Proceeding with CV analysis...");
  };

  const handleGenerateLetter = () => {
    if (!isPremium && freeUsesRemaining <= 0) {
      setShowUpgradeModal(true);
      return;
    }
    // TODO: call coverLetterApi.generate() here
    console.log("Proceeding with cover letter generation...");
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const response = await subscriptionApi.createCheckout(
        `${window.location.origin}/dashboard/cv-tools?subscription=success`,
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
          CV & Cover Letter Tools
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Optimize your resume for ATS and generate tailored cover letters in seconds.
        </p>
      </div>

      {/* Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel: CV Optimization */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">analytics</span>
                <CardTitle>CV Optimization</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Upload CV
                </label>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer group",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary/50",
                    file && "border-green-500 bg-green-50 dark:bg-green-900/10"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("cv-file-input")?.click()}
                >
                  <input
                    id="cv-file-input"
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <div
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                      file
                        ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                        : "bg-white dark:bg-gray-700 shadow-sm text-gray-400 group-hover:text-primary"
                    )}
                  >
                    <span className="material-symbols-outlined text-3xl">
                      {file ? "check_circle" : "upload_file"}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {file ? file.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-gray-500">PDF, DOCX (Max 10MB)</p>
                  </div>
                </div>
              </div>

              {/* Job Description Input */}
              <Textarea
                label="Job Description"
                placeholder="Paste the job advertisement here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[160px]"
              />

              <Button className="w-full" onClick={handleOptimize}>
                Optimize & Analyze
              </Button>
            </CardContent>
          </Card>

          {/* ATS Analysis Results */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-6">
                <h4 className="text-md font-bold">ATS Analysis Output</h4>
                <Badge variant="success">LIVE SCAN</Badge>
              </div>
              <div className="flex gap-8 items-center">
                {/* Match Score */}
                <div className="relative flex-shrink-0">
                  <svg className="h-24 w-24 transform -rotate-90">
                    <circle
                      className="text-gray-100 dark:text-gray-800"
                      cx="48"
                      cy="48"
                      fill="transparent"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                    />
                    <circle
                      className="text-primary"
                      cx="48"
                      cy="48"
                      fill="transparent"
                      r="40"
                      stroke="currentColor"
                      strokeDasharray="251.2"
                      strokeDashoffset="62.8"
                      strokeWidth="8"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold leading-none">75%</span>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                      Match
                    </span>
                  </div>
                </div>
                {/* Feedback */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your profile is a strong match for this role, but we found 4
                    missing critical keywords.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="error" className="text-[10px] uppercase">
                      Cloud Architecture
                    </Badge>
                    <Badge variant="error" className="text-[10px] uppercase">
                      Stakeholder Mgmt
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      +2 more
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Cover Letter Generator */}
        <Card className="flex flex-col min-h-[700px]">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined">auto_fix_high</span>
              <CardTitle>Cover Letter Generator</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-6">
            {/* Tone Selection */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Select Tone
              </p>
              <div className="grid grid-cols-3 gap-3 p-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {tones.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    className={cn(
                      "py-2.5 px-3 text-xs font-bold rounded-md transition-colors",
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

            <Button className="w-full" onClick={handleGenerateLetter}>
              <span className="material-symbols-outlined text-xl">magic_button</span>
              Generate Letter
            </Button>

            {/* Editable Output Area */}
            <div className="flex-1 flex flex-col min-h-[400px]">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                AI Generated Output
                <span className="flex gap-4">
                  <button className="text-primary hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    Copy
                  </button>
                  <button className="text-primary hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">download</span>
                    PDF
                  </button>
                </span>
              </p>
              <div className="flex-1 relative">
                <textarea
                  className="w-full h-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 focus:ring-primary focus:border-primary text-sm p-6 leading-relaxed text-gray-700 dark:text-gray-300 resize-none"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  spellCheck={false}
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Optimized for ATS
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
                  "Unlimited CV optimization",
                  "Unlimited cover letter generation",
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
