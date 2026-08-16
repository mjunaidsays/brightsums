"use client";

import { useState, useTransition } from "react";
import { reviewDocument } from "@/actions/admin-documents.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DocumentReviewPanel({
  documentId,
  studentUserId,
  fileName,
}: {
  documentId: string;
  studentUserId: string;
  fileName: string;
}) {
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done) return <p className="font-bold text-success-600">Review submitted.</p>;

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-control)] border-2 border-tertiary-200 bg-tertiary-200/20 p-4">
      <a
        href={`/api/documents/${documentId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-primary-600 underline"
      >
        View {fileName}
      </a>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="success"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await reviewDocument(documentId, studentUserId, "approved");
              setDone(true);
            })
          }
        >
          Approve
        </Button>
        <Input
          placeholder="Rejection reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="h-10 max-w-xs"
        />
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await reviewDocument(documentId, studentUserId, "rejected", reason || undefined);
              setDone(true);
            })
          }
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
