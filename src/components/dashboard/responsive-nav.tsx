"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { authClient } from "@/server/auth/auth-client";
import { useMotionSafe } from "@/components/motion/reduced-motion-provider";

export type NavItem = { href: string; label: string; icon: string; exact?: boolean };

/**
 * Shared nav shell for both the student and admin sidebars — below `md:` it
 * collapses to a sticky top bar + hamburger that opens a slide-in drawer;
 * at `md:` and up it renders as the same always-visible fixed sidebar both
 * navs had before this component existed. Extracted here because
 * student-nav.tsx and admin-nav.tsx were otherwise near-identical (brand,
 * item list with active-state highlighting, footer links, logout) — this
 * keeps the responsive drawer logic in exactly one place.
 */
export function ResponsiveNav({
  brandIcon,
  brandLabel,
  greeting,
  items,
  footer,
}: {
  brandIcon: string;
  brandLabel: string;
  greeting?: string;
  items: NavItem[];
  footer?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const motionSafe = useMotionSafe();
  const [open, setOpen] = useState(false);
  // Close the drawer automatically when the route changes (e.g. tapping a
  // link, or back/forward nav). This is React's documented pattern for
  // "reset state when a prop changes" — a conditional setState call during
  // render, not inside an effect — React detects it and re-renders before
  // painting, rather than the extra effect-triggered render cycle.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // Lock background scroll while the mobile drawer is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
  }

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const navBody = (
    <>
      <div className="mb-4 flex items-center gap-2 px-2">
        <span className="text-2xl">{brandIcon}</span>
        <span className="font-display text-xl font-extrabold text-primary-600">{brandLabel}</span>
      </div>
      {greeting && <p className="mb-2 px-2 text-sm font-bold text-muted-foreground">{greeting}</p>}
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-[var(--radius-control)] px-4 py-3 font-display font-bold transition-colors",
            isActive(item) ? "bg-primary-500 text-white" : "text-foreground hover:bg-muted"
          )}
        >
          <span>{item.icon}</span>
          {item.label}
        </Link>
      ))}
      {footer}
      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 flex items-center gap-3 rounded-[var(--radius-control)] px-4 py-3 text-left font-display font-bold text-muted-foreground hover:bg-muted"
      >
        <span>🚪</span> Log Out
      </button>
    </>
  );

  return (
    <>
      {/* Mobile: sticky top bar with hamburger toggle */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-border bg-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{brandIcon}</span>
          <span className="font-display text-lg font-extrabold text-primary-600">{brandLabel}</span>
        </div>
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex size-11 items-center justify-center rounded-[var(--radius-control)] text-2xl hover:bg-muted"
        >
          ☰
        </button>
      </div>

      {/* Mobile: slide-in drawer + backdrop */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: motionSafe ? 0.2 : 0 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.nav
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-1 overflow-y-auto bg-card p-4 shadow-2xl md:hidden"
              initial={{ x: motionSafe ? "-100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: motionSafe ? "-100%" : 0 }}
              transition={motionSafe ? { type: "spring", stiffness: 320, damping: 32 } : { duration: 0 }}
            >
              {navBody}
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Desktop/tablet: always-visible fixed sidebar. min-h-screen (not
          h-full) so it always reaches at least full viewport height without
          depending on the flex parent's height being resolved first — a
          percentage height here was leaving a gap below the nav whenever
          the page content was shorter than the viewport. */}
      <nav className="hidden md:sticky md:top-0 md:flex md:h-screen md:min-h-screen md:w-64 md:flex-col md:gap-1 md:self-start md:overflow-y-auto md:border-r-2 md:border-border md:bg-card md:p-4">
        {navBody}
      </nav>
    </>
  );
}
