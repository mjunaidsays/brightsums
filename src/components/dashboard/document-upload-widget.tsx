"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  not_submitted: { label: "Not Submitted", className: "bg-muted text-muted-foreground" },
  pending: { label: "Pending Review", className: "bg-tertiary-200 text-amber-700" },
  approved: { label: "Approved", className: "bg-success-100 text-success-600" },
  rejected: { label: "Rejected", className: "bg-danger-100 text-danger-600" },
};

export function DocumentUploadWidget({
  status,
  fileName,
  documentId,
  rejectionReason,
}: {
  status: string;
  fileName?: string;
  documentId?: string;
  rejectionReason?: string | null;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/document", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      setFile(null);
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.not_submitted;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span
          className={cn("rounded-[var(--radius-pill)] px-3 py-1 text-sm font-bold", statusInfo.className)}
        >
          {statusInfo.label}
        </span>
        {fileName && documentId && (
          <a
            href={`/api/documents/${documentId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-primary-600 underline"
          >
            View {fileName}
          </a>
        )}
      </div>

      {status === "rejected" && rejectionReason && (
        <p className="text-sm font-bold text-destructive">Reason: {rejectionReason}</p>
      )}

      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <Button size="sm" onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
      {error && <p className="text-sm font-bold text-destructive">{error}</p>}
    </div>
  );
}
