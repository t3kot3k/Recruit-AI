"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { applicationApi } from "@/lib/api/client";
import type { ApplicationResponse, ApplicationStatus } from "@/lib/api/client";

const statusConfig: Record<ApplicationStatus, { label: string; variant: "secondary" | "success" | "error"; icon: string }> = {
  saved: { label: "Saved", variant: "secondary", icon: "bookmark" },
  applied: { label: "Applied", variant: "secondary", icon: "send" },
  interview: { label: "Interview", variant: "success", icon: "event" },
  offer: { label: "Offer", variant: "success", icon: "celebration" },
  rejected: { label: "Rejected", variant: "error", icon: "close" },
};

const allStatuses: ApplicationStatus[] = ["saved", "applied", "interview", "offer", "rejected"];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("saved");
  const [jobUrl, setJobUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await applicationApi.getAll();
      setApplications(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCompanyName("");
    setPosition("");
    setStatus("saved");
    setJobUrl("");
    setNotes("");
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (app: ApplicationResponse) => {
    setCompanyName(app.company_name);
    setPosition(app.position);
    setStatus(app.status);
    setJobUrl(app.job_url || "");
    setNotes(app.notes || "");
    setEditingId(app.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!companyName.trim() || !position.trim()) return;

    setSaving(true);
    try {
      if (editingId) {
        await applicationApi.update(editingId, {
          company_name: companyName,
          position,
          status,
          job_url: jobUrl || undefined,
          notes: notes || undefined,
        });
      } else {
        await applicationApi.create({
          company_name: companyName,
          position,
          status,
          job_url: jobUrl || undefined,
          notes: notes || undefined,
        });
      }
      setShowModal(false);
      resetForm();
      loadApplications();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      await applicationApi.update(appId, { status: newStatus });
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
      );
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (appId: string) => {
    if (!window.confirm("Delete this application?")) return;
    setDeleting(appId);
    try {
      await applicationApi.delete(appId);
      setApplications((prev) => prev.filter((app) => app.id !== appId));
    } catch {
      // silently fail
    } finally {
      setDeleting(null);
    }
  };

  const grouped = allStatuses.reduce((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s);
    return acc;
  }, {} as Record<ApplicationStatus, ApplicationResponse[]>);

  return (
    <>
      {/* Page Heading */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Application Tracker
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Track and manage your job applications in one place.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Application
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {allStatuses.map((s) => {
          const config = statusConfig[s];
          const count = grouped[s]?.length ?? 0;
          return (
            <div
              key={s}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center"
            >
              <span className="material-symbols-outlined text-lg text-gray-400 mb-1">
                {config.icon}
              </span>
              <p className="text-2xl font-black">{count}</p>
              <p className="text-xs text-gray-500">{config.label}</p>
            </div>
          );
        })}
      </div>

      {/* Application Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-4">
              outgoing_mail
            </span>
            <h3 className="text-lg font-bold mb-2">No applications yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Start tracking your job applications to stay organized.
            </p>
            <Button onClick={openCreateModal}>Add First Application</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3">
                      Company
                    </th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3">
                      Position
                    </th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3">
                      Date
                    </th>
                    <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const config = statusConfig[app.status];
                    return (
                      <tr
                        key={app.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold">{app.company_name}</p>
                            {app.job_url && (
                              <a
                                href={app.job_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                View posting
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm">{app.position}</p>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={app.status}
                            onChange={(e) =>
                              handleStatusChange(app.id, e.target.value as ApplicationStatus)
                            }
                            className="text-xs font-medium px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer"
                          >
                            {allStatuses.map((s) => (
                              <option key={s} value={s}>
                                {statusConfig[s].label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500">
                            {app.created_at
                              ? new Date(app.created_at).toLocaleDateString()
                              : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(app)}
                              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary transition-colors"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(app.id)}
                              disabled={deleting === app.id}
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-lg">
                                {deleting === app.id ? "hourglass_empty" : "delete"}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#1c2231] rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">
              {editingId ? "Edit Application" : "Add Application"}
            </h3>
            <div className="space-y-4">
              <Input
                label="Company Name"
                placeholder="e.g. Google"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <Input
                label="Position"
                placeholder="e.g. Senior Software Engineer"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {allStatuses.map((s) => {
                    const config = statusConfig[s];
                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={cn(
                          "py-2 px-2 text-xs font-bold rounded-lg border transition-colors text-center",
                          status === s
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-primary/50"
                        )}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Input
                label="Job URL (optional)"
                placeholder="https://..."
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
              />
              <Textarea
                label="Notes (optional)"
                placeholder="Any notes about this application..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={saving || !companyName.trim() || !position.trim()}
                  isLoading={saving}
                >
                  {editingId ? "Save Changes" : "Add Application"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
