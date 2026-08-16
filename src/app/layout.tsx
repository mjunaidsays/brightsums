import type { Metadata } from "next";
import { Nunito, Baloo_2 } from "next/font/google";
import { ReducedMotionProvider } from "@/components/motion/reduced-motion-provider";
import "./globals.css";

// Rounded, highly legible sans, weights 400-800 (no thin weights) per
// CLAUDE.md §8.3 — used for body copy across the app.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// A bouncier rounded display face for headings, big score numbers, and
// buttons — reinforces the "fun, game-like" brief beyond a single font.
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "BrightSums",
  description: "Fun, timed math quizzes and contests for Grade 1-10 and O/A-Level students.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} ${baloo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ReducedMotionProvider>{children}</ReducedMotionProvider>
      </body>
    </html>
  );
}
