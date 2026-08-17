/**
 * Shared route-navigation spinner, used by the (student) and admin segment
 * loading.tsx files. Reduced-motion handling comes for free from the global
 * `prefers-reduced-motion` rule in globals.css, which caps animation-duration
 * app-wide — no separate guard needed here.
 */
export function LoadingSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-24" role="status" aria-label="Loading">
      <div className="border-muted border-t-primary size-10 animate-spin rounded-full border-4" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
