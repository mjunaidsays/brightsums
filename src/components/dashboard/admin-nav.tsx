"use client";

import { ResponsiveNav, type NavItem } from "./responsive-nav";

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "📊", exact: true },
  { href: "/admin/questions/upload", label: "Upload Bank", icon: "📤" },
  { href: "/admin/questions", label: "Questions", icon: "❓" },
  { href: "/admin/topics", label: "Topics", icon: "📚" },
  { href: "/admin/contests", label: "Contests", icon: "🏆" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/schools", label: "Schools", icon: "🏫" },
];

export function AdminNav() {
  return <ResponsiveNav brandIcon="🛠️" brandLabel="Admin" items={NAV_ITEMS} />;
}
