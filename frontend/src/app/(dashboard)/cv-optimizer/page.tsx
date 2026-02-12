"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { cvApi, subscriptionApi } from "@/lib/api/client";
import type { CVAnalysisResult, OptimizedCV } from "@/lib/api/client";
import { useCVStore } from "@/stores/cv-store";

const templates = [
  { id: "classic", label: "Classic" },
  { id: "minimalist", label: "Minimalist" },
  { id: "executive", label: "Executive" },
] as const;

export default function CVOptimizerPage() {
  const { isPremium, freeUsesRemaining } = useAuth();

  // Shared store
  const setStoreJobDescription = useCVStore((s) => s.setJobDescription);
  const setStoreAnalysisResult = useCVStore((s) => s.setAnalysisResult);

  // Step tracking
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Upload + Job Description
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  // Step 2: ATS Analysis Results
  const [analysis, setAnalysis] = useState<CVAnalysisResult | null>(null);

  // Step 3: Optimized CV
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedCV, setOptimizedCV] = useState<OptimizedCV | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("classic");
  const [exporting, setExporting] = useState(false);

  // Upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

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

  const handleAnalyze = async () => {
    if (!file || !jobDescription.trim()) {
      setAnalysisError("Please upload a CV and paste a job description.");
      return;
    }
    if (jobDescription.trim().length < 50) {
      setAnalysisError("Job description must be at least 50 characters.");
      return;
    }

    setAnalysisError("");
    setAnalyzing(true);
    try {
      const result = await cvApi.analyze(file, jobDescription);
      // Check if it's a full result (has 'id' field) vs preview
      if ("id" in result) {
        setAnalysis(result as CVAnalysisResult);
        setStoreJobDescription(jobDescription);
        setStoreAnalysisResult(result as CVAnalysisResult);
        setStep(2);
      } else {
        // Preview result — still show step 2 with limited data
        setAnalysis({
          id: "",
          user_id: "",
          overall_score: result.overall_score,
          ats_compatibility: result.overall_score,
          keyword_matches: result.preview_keywords,
          missing_keywords: [],
          sections: [],
          summary: result.summary_preview,
          improvement_tips: [],
          created_at: "",
        });
        setStep(2);
      }
    } catch {
      setAnalysisError("Failed to analyze CV. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOptimize = async () => {
    if (!isPremium && freeUsesRemaining <= 0) {
      setShowUpgradeModal(true);
      return;
    }
    if (!file) return;

    setOptimizing(true);
    try {
      const result = await cvApi.optimize(file, jobDescription, analysis?.id);
      setOptimizedCV(result);
      setStep(3);
    } catch (err) {
      if (err instanceof Error && "status" in err && (err as { status: number }).status === 402) {
        setShowUpgradeModal(true);
      }
    } finally {
      setOptimizing(false);
    }
  };

  const handleExportPdf = async () => {
    if (!optimizedCV) return;
    setExporting(true);
    try {
      const blob = await cvApi.exportPdf(optimizedCV, selectedTemplate);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "optimized_cv.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const response = await subscriptionApi.createCheckout(
        `${window.location.origin}/dashboard/cv-optimizer?subscription=success`,
        window.location.href
      );
      window.location.href = response.checkout_url;
    } catch {
      setSubscribing(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <>
      {/* Page Heading */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          CV Optimizer
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Upload your CV, get ATS analysis, and generate an optimized version.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-2">
        {[
          { n: 1, label: "Upload & Analyze" },
          { n: 2, label: "ATS Results" },
          { n: 3, label: "Optimized CV" },
        ].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                step >= n
                  ? "bg-primary text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500"
              )}
            >
              {step > n ? (
                <span className="material-symbols-outlined text-sm">check</span>
              ) : (
                n
              )}
            </div>
            <span
              className={cn(
                "text-sm font-medium hidden sm:inline",
                step >= n ? "text-gray-900 dark:text-white" : "text-gray-400"
              )}
            >
              {label}
            </span>
            {n < 3 && (
              <div
                className={cn(
                  "w-8 h-0.5 mx-1",
                  step > n ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">upload_file</span>
                <CardTitle>Upload CV & Job Description</CardTitle>
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
                  onClick={() => document.getElementById("cv-upload")?.click()}
                >
                  <input
                    id="cv-upload"
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

              <Textarea
                label="Job Description"
                placeholder="Paste the full job advertisement here (minimum 50 characters)..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[180px]"
              />

              {analysisError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {analysisError}
                </p>
              )}

              <Button
                className="w-full"
                onClick={handleAnalyze}
                disabled={analyzing}
                isLoading={analyzing}
              >
                <span className="material-symbols-outlined">analytics</span>
                Analyze CV (Always Free)
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: ATS Results */}
      {step === 2 && analysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Card */}
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="relative inline-flex">
                  <svg className="h-32 w-32 transform -rotate-90">
                    <circle
                      className="text-gray-100 dark:text-gray-800"
                      cx="64" cy="64" fill="transparent" r="56" stroke="currentColor" strokeWidth="10"
                    />
                    <circle
                      className={scoreColor(analysis.overall_score)}
                      cx="64" cy="64" fill="transparent" r="56" stroke="currentColor"
                      strokeDasharray={2 * Math.PI * 56}
                      strokeDashoffset={2 * Math.PI * 56 * (1 - analysis.overall_score / 100)}
                      strokeWidth="10" strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn("text-3xl font-black", scoreColor(analysis.overall_score))}>
                      {analysis.overall_score}%
                    </span>
                    <span className="text-xs text-gray-500 uppercase font-bold">ATS Match</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">{analysis.summary}</p>
              </CardContent>
            </Card>

            {/* Keywords */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Keyword Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.keyword_matches.map((km) => (
                    <div key={km.keyword} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "material-symbols-outlined text-sm",
                          km.found ? "text-green-500" : "text-red-500"
                        )}>
                          {km.found ? "check_circle" : "cancel"}
                        </span>
                        <span className="text-sm font-medium">{km.keyword}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={km.importance === "high" ? "error" : "secondary"} className="text-[10px]">
                          {km.importance}
                        </Badge>
                        {km.suggestion && (
                          <span className="text-xs text-gray-400 max-w-[200px] truncate">
                            {km.suggestion}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {analysis.missing_keywords.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Missing Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.missing_keywords.map((kw) => (
                        <Badge key={kw} variant="error" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Section Breakdown */}
          {analysis.sections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Section Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.sections.map((section) => (
                    <div key={section.name} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold">{section.name}</span>
                        <span className={cn("text-sm font-bold", scoreColor(section.score))}>
                          {section.score}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                        <div
                          className={cn(
                            "h-2 rounded-full",
                            section.score >= 80 ? "bg-green-500" :
                            section.score >= 60 ? "bg-yellow-500" : "bg-red-500"
                          )}
                          style={{ width: `${section.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">{section.feedback}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Improvement Tips */}
          {analysis.improvement_tips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Improvement Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.improvement_tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="material-symbols-outlined text-primary text-sm mt-0.5">
                        lightbulb
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => setStep(1)}>
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back
            </Button>
            <Button onClick={handleOptimize} disabled={optimizing} isLoading={optimizing}>
              <span className="material-symbols-outlined">auto_fix_high</span>
              Optimize CV with AI
              {!isPremium && <span className="text-xs opacity-75 ml-1">({freeUsesRemaining} uses left)</span>}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Optimized CV */}
      {step === 3 && optimizedCV && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Preview */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                      <span className="material-symbols-outlined">description</span>
                      <CardTitle>Optimized CV Preview</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      {optimizedCV.estimated_score}% ATS Score
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Contact */}
                  <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-xl font-bold">{optimizedCV.contact_name}</h3>
                    <p className="text-sm text-gray-500">
                      {[optimizedCV.contact_email, optimizedCV.contact_phone, optimizedCV.contact_location]
                        .filter(Boolean)
                        .join(" | ")}
                    </p>
                  </div>

                  {/* Summary */}
                  {optimizedCV.summary && (
                    <div>
                      <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                        Professional Summary
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {optimizedCV.summary}
                      </p>
                    </div>
                  )}

                  {/* Experience */}
                  {optimizedCV.experience.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">
                        Experience
                      </h4>
                      <div className="space-y-4">
                        {optimizedCV.experience.map((exp, i) => (
                          <div key={i}>
                            <div className="flex items-baseline justify-between">
                              <p className="font-semibold text-sm">
                                {exp.title} {exp.organization && <>— {exp.organization}</>}
                              </p>
                              {exp.period && <span className="text-xs text-gray-400">{exp.period}</span>}
                            </div>
                            <ul className="mt-1 space-y-1">
                              {exp.bullets.map((bullet, j) => (
                                <li key={j} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                  <span className="text-gray-400 mt-1">•</span>
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {optimizedCV.education.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">
                        Education
                      </h4>
                      <div className="space-y-2">
                        {optimizedCV.education.map((edu, i) => (
                          <div key={i}>
                            <p className="font-semibold text-sm">
                              {edu.title} {edu.organization && <>— {edu.organization}</>}
                            </p>
                            {edu.period && <p className="text-xs text-gray-400">{edu.period}</p>}
                            {edu.details && <p className="text-xs text-gray-500">{edu.details}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {optimizedCV.skills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                        Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {optimizedCV.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {optimizedCV.certifications.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                        Certifications
                      </h4>
                      <ul className="space-y-1">
                        {optimizedCV.certifications.map((cert, i) => (
                          <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-sm">verified</span>
                            {cert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Export Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Export PDF</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Choose Template
                  </p>
                  <div className="space-y-2">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left text-sm font-medium transition-colors",
                          selectedTemplate === t.id
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleExportPdf}
                    disabled={exporting}
                    isLoading={exporting}
                  >
                    <span className="material-symbols-outlined">download</span>
                    Download PDF
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <span className="material-symbols-outlined">verified</span>
                    <span className="text-sm font-bold">ATS Optimized</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    This CV uses standard fonts, clear headings, and keyword-rich content for maximum ATS compatibility.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => setStep(2)}>
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to Analysis
            </Button>
            <Button variant="secondary" onClick={() => { setStep(1); setAnalysis(null); setOptimizedCV(null); }}>
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              Start Over
            </Button>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#1c2231] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-primary text-3xl">workspace_premium</span>
              </div>
              <h3 className="text-xl font-bold">Upgrade to Pro</h3>
              <p className="text-sm text-gray-500">
                You&apos;ve used all your free AI uses. Upgrade to Pro for unlimited CV optimization.
              </p>
              <p className="text-3xl font-black">
                $19<span className="text-base font-normal text-gray-400">/month</span>
              </p>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowUpgradeModal(false)}>
                  Maybe Later
                </Button>
                <Button className="flex-1" onClick={handleSubscribe} disabled={subscribing} isLoading={subscribing}>
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
