import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  basePath,
}: {
  page: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const joiner = basePath.includes("?") ? "&" : "?";
  const hrefFor = (p: number) => `${basePath}${joiner}page=${p}`;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        className={cn(
          "rounded-[var(--radius-pill)] border-2 border-border px-4 py-2 font-bold",
          page <= 1 && "pointer-events-none opacity-40"
        )}
      >
        Prev
      </Link>
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          className={cn(
            "size-10 flex items-center justify-center rounded-[var(--radius-pill)] font-bold",
            p === page ? "bg-primary-500 text-white" : "border-2 border-border"
          )}
        >
          {p}
        </Link>
      ))}
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        className={cn(
          "rounded-[var(--radius-pill)] border-2 border-border px-4 py-2 font-bold",
          page >= totalPages && "pointer-events-none opacity-40"
        )}
      >
        Next
      </Link>
    </div>
  );
}
