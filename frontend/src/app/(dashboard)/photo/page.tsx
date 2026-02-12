"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { photoApi, subscriptionApi } from "@/lib/api/client";

const backgrounds = [
  { id: "original", label: "Original", icon: "image" },
  { id: "blur", label: "Soft Blur", icon: "blur_on" },
  { id: "office", label: "Office", icon: "corporate_fare" },
  { id: "solid", label: "Solid Color", icon: "format_color_fill" },
];

export default function PhotoPage() {
  const { isPremium, freeUsesRemaining } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState("blur");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

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
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileSelect = (f: File) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResultUrl(null);
    setError("");
  };

  const handleEnhance = async () => {
    if (!file) return;

    if (!isPremium && freeUsesRemaining <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setError("");
    setIsProcessing(true);
    try {
      const blob = await photoApi.enhance(file, selectedBackground);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (err) {
      if (err instanceof Error && "status" in err && (err as { status: number }).status === 402) {
        setShowUpgradeModal(true);
      } else {
        setError("Failed to enhance photo. Please try a different image.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "enhanced_photo.jpg";
    a.click();
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setError("");
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const response = await subscriptionApi.createCheckout(
        `${window.location.origin}/dashboard/photo?subscription=success`,
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
          Photo Studio
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Transform your photos into professional LinkedIn-ready headshots.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">photo_camera</span>
              Upload Your Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer aspect-square",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 dark:border-gray-700 hover:border-primary/50",
                file && "border-green-500 bg-green-50 dark:bg-green-900/10"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("photo-input")?.click()}
            >
              <input
                id="photo-input"
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
              {previewUrl ? (
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto rounded-full bg-gray-200 mb-4 overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {file?.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Click to change photo</p>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                    <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">JPEG, PNG (Max 10MB)</p>
                  </div>
                </>
              )}
            </div>

            {/* Background Selection */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">Background Style</p>
              <div className="grid grid-cols-4 gap-3">
                {backgrounds.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setSelectedBackground(bg.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                      selectedBackground === bg.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                    )}
                  >
                    <span className="material-symbols-outlined text-2xl">{bg.icon}</span>
                    <span className="text-xs font-medium">{bg.label}</span>
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
              disabled={!file || isProcessing}
              onClick={handleEnhance}
              isLoading={isProcessing}
            >
              <span className="material-symbols-outlined">auto_fix_high</span>
              Enhance Photo
            </Button>

            {!isPremium && (
              <p className="text-xs text-center text-gray-400">
                {freeUsesRemaining} free AI use{freeUsesRemaining !== 1 ? "s" : ""} remaining
              </p>
            )}
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">compare</span>
                {resultUrl ? "Enhanced Result" : "Preview"}
              </span>
              {resultUrl && <Badge variant="success">LinkedIn Ready</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl flex items-center justify-center overflow-hidden">
              {isProcessing ? (
                <div className="text-center space-y-3">
                  <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-sm text-gray-500">Enhancing your photo...</p>
                  <p className="text-xs text-gray-400">This may take a moment</p>
                </div>
              ) : resultUrl ? (
                <img
                  src={resultUrl}
                  alt="Enhanced"
                  className="w-full h-full object-contain"
                />
              ) : previewUrl ? (
                <div className="w-3/4 aspect-square rounded-full overflow-hidden shadow-2xl border-4 border-white dark:border-gray-700">
                  <img
                    src={previewUrl}
                    alt="Original preview"
                    className="w-full h-full object-cover opacity-60"
                  />
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <span className="material-symbols-outlined text-6xl mb-4">person</span>
                  <p className="text-sm">Upload a photo to see preview</p>
                </div>
              )}
            </div>
            {(resultUrl || previewUrl) && (
              <div className="mt-6 flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={handleReset}>
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  Reset
                </Button>
                {resultUrl && (
                  <Button className="flex-1" onClick={handleDownload}>
                    <span className="material-symbols-outlined text-sm">download</span>
                    Download
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                You&apos;ve used all your free AI uses. Upgrade to Pro for unlimited photo enhancements.
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
