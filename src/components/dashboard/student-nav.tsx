"use client";

import { ResponsiveNav, type NavItem } from "./responsive-nav";

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "My Board", icon: "🏠" },
  { href: "/practice", label: "Practice", icon: "✏️" },
  { href: "/contest", label: "Contest", icon: "🏆" },
  { href: "/leaderboard", label: "Champions Board", icon: "🥇" },
  { href: "/profile", label: "My Profile", icon: "👤" },
];

export function StudentNav({ fullName }: { fullName: string }) {
  return (
    <ResponsiveNav
      brandIcon="🧮"
      brandLabel="BrightSums"
      greeting={`Hi, ${fullName.split(" ")[0]}!`}
      items={NAV_ITEMS}
    />
  );
}
