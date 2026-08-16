"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { GRADE_BANDS, GRADE_BAND_LABELS, type GradeBand } from "@/lib/constants";

type Topic = { id: string; name: string; gradeBand: string };

type ValidateResponse = {
  accepted: number;
  rejected: { sourceId: string | number; reason: string; detail: string }[];
  totalRows: number;
};

type CommitResponse = { inserted: number; rejected: ValidateResponse["rejected"]; topicId: string };

export function QuestionBankUploader({ topics }: { topics: Topic[] }) {
  const [gradeBand, setGradeBand] = useState<GradeBand>("grade_2");
  const [topicMode, setTopicMode] = useState<"existing" | "new">("existing");
  const [topicId, setTopicId] = useState("");
  const [newTopicName, setNewTopicName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ValidateResponse | null>(null);
  const [committed, setCommitted] = useState<CommitResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topicsForGrade = topics.filter((t) => t.gradeBand === gradeBand);

  async function runUpload(mode: "validate" | "commit") {
    if (!file) {
      setError("Choose a JSON or CSV file first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const fileContent = await file.text();
      const fileType = file.name.endsWith(".csv") ? "csv" : "json";
      const res = await fetch("/api/uploads/question-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileContent,
          fileType,
          gradeBand,
          topicId: topicMode === "existing" ? topicId || undefined : undefined,
          newTopicName: topicMode === "new" ? newTopicName : undefined,
          mode,
          sourceLabel: file.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Upload failed. Check your file format.");
        return;
      }
      if (mode === "validate") setReport(data as ValidateResponse);
      else setCommitted(data as CommitResponse);
    } finally {
      setLoading(false);
    }
  }

  if (committed) {
    return (
      <div className="flex flex-col gap-3 rounded-[var(--radius-control)] border-2 border-success-500 bg-success-100 p-4">
        <p className="font-display text-lg font-bold text-success-600">
          Imported {committed.inserted} question(s) successfully! 🎉
        </p>
        {committed.rejected.length > 0 && (
          <p className="text-sm font-bold text-muted-foreground">
            {committed.rejected.length} row(s) were skipped (see reasons below).
          </p>
        )}
        <Button
          variant="outline"
          onClick={() => {
            setCommitted(null);
            setReport(null);
            setFile(null);
          }}
        >
          Upload Another Bank
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gradeBand">Grade</Label>
          <select
            id="gradeBand"
            value={gradeBand}
            onChange={(e) => {
              setGradeBand(e.target.value as GradeBand);
              setReport(null);
            }}
            className="h-12 rounded-[var(--radius-control)] border-2 border-border bg-card px-3 text-base"
          >
            {GRADE_BANDS.map((band) => (
              <option key={band} value={band}>
                {GRADE_BAND_LABELS[band]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Topic</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTopicMode("existing")}
              className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-sm font-bold ${topicMode === "existing" ? "bg-primary-500 text-white" : "bg-muted"}`}
            >
              Existing
            </button>
            <button
              type="button"
              onClick={() => setTopicMode("new")}
              className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-sm font-bold ${topicMode === "new" ? "bg-primary-500 text-white" : "bg-muted"}`}
            >
              New Topic
            </button>
          </div>
        </div>
      </div>

      {topicMode === "existing" ? (
        <select
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          className="h-12 rounded-[var(--radius-control)] border-2 border-border bg-card px-3 text-base"
        >
          <option value="">Select a topic...</option>
          {topicsForGrade.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      ) : (
        <Input
          placeholder="New topic name (e.g. Fractions & Decimals)"
          value={newTopicName}
          onChange={(e) => setNewTopicName(e.target.value)}
        />
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="file">JSON or CSV file</Label>
        <input
          id="file"
          type="file"
          accept=".json,.csv"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setReport(null);
          }}
          className="rounded-[var(--radius-control)] border-2 border-dashed border-border p-4"
        />
      </div>

      {error && <p className="font-bold text-destructive">{error}</p>}

      {!report ? (
        <Button onClick={() => runUpload("validate")} disabled={loading}>
          {loading ? "Validating..." : "Validate File"}
        </Button>
      ) : (
        <div className="flex flex-col gap-3 rounded-[var(--radius-control)] border-2 border-border bg-muted p-4">
          <p className="font-display font-bold">
            {report.accepted} of {report.totalRows} question(s) will be imported.
          </p>
          {report.rejected.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="font-bold text-destructive">{report.rejected.length} rejected:</p>
              <ul className="max-h-48 overflow-y-auto text-sm">
                {report.rejected.map((r) => (
                  <li key={String(r.sourceId)} className="border-t border-border py-1">
                    <span className="font-bold">#{r.sourceId}</span>: {r.detail}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={() => runUpload("commit")} disabled={loading || report.accepted === 0}>
              {loading ? "Importing..." : `Confirm Import (${report.accepted})`}
            </Button>
            <Button variant="outline" onClick={() => setReport(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
