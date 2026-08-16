# BrightSums (MATHmania-style) — Project Brief

> Status: **Research / planning phase only.** No implementation has started. This file is
> the single source of truth for what we're building and why. Update it whenever scope,
> stack, or flow decisions change.

## 1. What this is

A web app (not mobile) where students from **Grade 1–10 and O/A-Levels in Pakistan**
practice and compete in **Multiple Choice Question quizzes**. Launch subject is **Math
only**; architecture must not hard-code "math" anywhere so English, Urdu, Science, etc.
can be added later as more subjects/JSON banks without a redesign.

Direct reference product: [mathmania.pk/dashboard](https://mathmania.pk/dashboard/) (see
screenshots already reviewed — student dashboard, practice attempts, contest attempts,
champions board/leaderboard with grade+round filters, profile page). A second reference
(`froze-gecko-44157394.figma.site`) was requested but is currently unreachable (404) —
re-check this link with the user if fresh UI inspiration from it is still wanted.

The core differentiator we should aim for beyond copying MATHmania: a **much more fun,
animated, "game-like" feel** (closer to Kahoot/Blooket/Prodigy than a plain exam portal),
while keeping it dirt cheap to run.

## 2. Non-negotiable cost constraint

**The user wants this to run at $0/month if at all possible**, or as close to free as
achievable, at least through the pilot/school-launch stage. This shapes almost every
stack decision below — see §6.

## 3. User roles & end-to-end flow

### 3.1 Student flow
1. **Landing / Auth** — Login or Sign Up choice.
2. **Sign Up (step 1)** — email, password, confirm password.
3. **Sign Up (step 2 — profile completion)** — full name, age, parent/guardian name,
   parent/guardian phone number, grade/class (or "Intermediate/A-Levels" style band),
   school name. School + grade are what the leaderboard ranks against, so validate/
   normalize school name input carefully (consider an autocomplete/typeahead backed by
   a growing `schools` table rather than free text, to avoid "LGS", "L.G.S", "Lahore
   Grammar School" fragmenting rankings).
4. **Login** — email + password. Must support "forgot/change password" (email-based
   reset).
5. **Dashboard (My Board)** — matches reference screenshots: student name, grade band,
   ID; rank card; best score card with circular progress; attempts chart (score vs
   attempt number, line/area chart); "My Contest Attempts" table (empty state: "Not
   Attempted Yet"); "My Practice Attempts" table with Attempt/Score/Percentage/Date;
   "Practice Now" and "Play Contest" CTAs; "See All Attempts" links.
6. **Practice** — student picks Grade (usually locked to their own) → Topic (e.g.
   "Repeated Addition & Multiplication") → starts a 10-question practice quiz. Unlimited
   or admin-configured attempt count. Does not affect leaderboard rank (or affects a
   separate "practice" ranking only — confirm with user before building, MATHmania's
   screenshots show practice and contest tracked completely separately).
7. **Contest** — same quiz engine, but gated by admin-defined rounds (Round 1/2/3 seen in
   reference screenshots — "top 10 students per grade advance to next round"), attempt
   limits, and eligibility windows (open/closed dates). Feeds the real leaderboard.
8. **Quiz engine (practice & contest share this)** — see §4, the most detail-sensitive
   part of the whole app.
9. **Attempt history** — separate paginated tables for practice and contest attempts.
10. **Champions Board / Leaderboard** — filter by Round (1/2/3/All) and by grade band
    (Grade 2 ... Grade 8, Matric/O-Levels, Intermediate/A-Levels — matches the pill
    filters in the reference screenshots), table of Rank/Name/School/City/Score, "My
    Rank" pill, pagination.
11. **Profile** — view all captured info (username, gender, grade band, phone, email,
    city, school, DOB), Edit Profile, Document Verification (reference app has this —
    likely for proving school enrollment before contest prizes; can be a fast-follow,
    not launch-blocking).
12. **Log out.**

### 3.2 Admin flow
- Upload a new question bank as **JSON or CSV** for a given Grade + Topic (create topic
  inline if new). App must validate the shape before accepting (see §5 for the schema we
  already have real data for).
- Edit contest **rounds**: name, open/close window, attempt limits, grade eligibility,
  which grades/how many advance.
- CRUD on individual questions (fix a typo without re-uploading the whole bank).
- Search **schools/users**, view a student's rank and attempt history (support/dispute
  resolution).
- (Fast-follow, not launch-blocking) bulk CSV student import, AI-assisted question
  generation from source documents with a human review queue, anti-cheat flags, export
  tools, multiple concurrent contest rounds.

## 4. Quiz engine — exact behavior spec

This is the part most likely to get subtly wrong, so it's spelled out precisely:

- Every quiz (practice or contest) = **exactly 10 questions**, worth **10 points each,
  100 total**. Questions are **randomly sampled** from the eligible bank (grade + topic,
  and in contest mode + round) **and shuffled** — never served in JSON order, and no two
  attempts by the same student should feel identical if the bank is large enough.
  Consider also shuffling each question's **option order** per-attempt (the reference
  JSON stores `correct_answer` as a value, not an index, which makes this safe/easy).
- **Question reveal animation** — question + its 4 options animate onto screen (stagger-
  in, not simultaneous pop — feels more "alive"). Timer starts only once options are
  visible, not before.
- **60-second per-question timer**, shown as a visible, animated countdown (ring or bar,
  color-shifts e.g. green→amber→red as it depletes — common pattern in Kahoot-likes and
  reads instantly to a child without needing to read the number).
- **On selecting an option before time runs out:**
  - Correct → that option turns **green**, award **10 points**, header point counter
    animates upward (count-up, not instant jump).
  - Incorrect → selected option turns **red**, the actually-correct option simultaneously
    turns **green** so the student sees both.
  - Either way, a **"See Reason"** control appears below. Tapping it reveals the
    explanation text from the bank's `explanation`/`reason` field, written/animated in a
    "teaching" tone (the sample JSON's explanations are already written this way — reuse
    them verbatim, don't regenerate).
  - Once answered (right or wrong) or revealed, a **"Next Question"** button appears —
    the student must tap it to advance; never auto-advance. This matters for pacing and
    for kids who want to actually read the reason.
- **On timeout with no selection:** show **"Time's Up!"** in red, correct option turns
  green, same "See Reason" + "Next Question" flow, 0 points for that question.
- **Server is the timing authority**, not the client clock (a student pausing/backgrounding
  the tab must not be able to "freeze" or extend their 60s). Record `served_at` when a
  question is dispatched and validate `submitted_at - served_at <= 60s (+small network
  buffer)` server-side; treat late submissions as timeouts regardless of what the client
  UI shows. This also gives you full per-question audit data for free (useful for a
  future anti-cheat pass and for admin dispute resolution).
- **End of quiz** — celebratory summary screen (confetti/animation, score out of 100,
  correct vs incorrect breakdown, maybe a badge/rank-up moment) before returning to
  dashboard or attempt history.

## 5. Data model (grounded in the real sample data)

Reference file: `grade2_math_mcqs_v2_varied.json` — flat structure:
```json
{
  "title": "Grade 2 Math MCQs: Repeated Addition & Multiplication",
  "total_questions": 100,
  "questions": [
    {
      "id": 1,
      "question": "...",
      "options": [9, 5, 6, 8],
      "correct_answer": 6,
      "explanation": "..."
    }
  ]
}
```
Notes/risks to design around:
- `correct_answer` is a **value**, not an index — fine for numeric-answer math questions,
  but won't generalize cleanly to non-numeric MCQs (English/Urdu/Science) or to two
  options that coincidentally have the same displayed text. Store an explicit
  `correct_option_index` internally at import time (derived by matching `correct_answer`
  against `options`) so downstream logic never re-parses values, and reject/flag any
  uploaded question where the match is ambiguous (duplicate values in `options`) or
  where `correct_answer` isn't found in `options` at all — this is the main validation
  the admin JSON/CSV importer needs to do.
- `options` order in the source file is already the *display* order for that record, but
  since we shuffle per-attempt at serve time, the original order doesn't matter — just
  don't mutate the source bank.
- No topic/grade field inside the JSON itself — that's supplied by the admin at upload
  time (which grade + which topic this file belongs to), not inferred from content.
- Core tables (naming indicative, not final): `users`, `schools`, `subjects` (Math today,
  extensible), `topics` (belongs to subject+grade), `questions` (belongs to topic; stores
  question text, options, correct_option_index, explanation, source), `contests`/`rounds`
  (grade eligibility, attempt limits, open/close window), `quiz_sessions` (student,
  mode=practice|contest, round if contest, topic/grade, started_at), `session_questions`
  (session, question, served_at, answered_at, selected_option, is_correct, timed_out —
  this granular table is what makes the timer enforceable and attempt history/audit
  possible), aggregate `attempts` view/table for the score summaries shown on dashboard.

## 6. Tech stack — optimized for **$0/month**

The attached 2-week plan (see `MATHmania-Web-App-2Week-Plan.md.pdf`) proposed Vercel Pro
+ Neon + Clerk/Auth.js + Resend, landing around **$25–115/month**. That plan is solid
architecturally but assumes paid tiers by default. Given the hard cost constraint, the
adjusted recommendation:

| Layer | Pick | Why |
|---|---|---|
| Framework | Next.js (App Router), one codebase for student + admin, route-protected (`/dashboard` vs `/admin`) | Same reasoning as the reference plan — collapses app+API+admin into one deploy. |
| Hosting | **Cloudflare Workers (via the `@opennextjs/cloudflare` adapter) — not Vercel Hobby** | Confirmed deployable: the OpenNext Cloudflare adapter reached 1.0 GA and supports Next.js SSR, ISR, middleware, and Server Actions with no major code changes — deploy is essentially `wrangler deploy` after adapter setup. Vercel's Hobby tier is explicitly **non-commercial use only** per its terms — a branded, schools-facing product with contests is commercial use even before any payment is collected, so Hobby is a real ToS risk, not just a scale limit. Cloudflare's free plan gives 100,000 requests/day (resets daily, static assets don't even count against it) and **zero egress fees ever** — at "hundreds to low-thousands of daily students" scale this is comfortably inside the free cap. If outgrown, the paid plan is a flat $5/month for 10M requests, not a per-seat fee. **Watch two things when building:** (1) the free plan's 10ms-of-CPU-time-per-invocation limit — this is compute time, not wall-clock, so waiting on the database doesn't count, but heavy server-side logic per request could bite; test real request CPU cost before launch. (2) `next/image` defaults to Vercel's image optimizer, which breaks on Workers — set `images.unoptimized: true` or wire a Cloudflare Images loader. |
| Database | **Neon Postgres free tier** over Cloudflare D1 | Both are viable and both are free, but D1 (SQLite-based) has no stored procedures, weaker concurrent-write handling, and a much thinner feature set for relational ranking/leaderboard queries (window functions, complex joins across users/schools/attempts) than Postgres — exactly the kind of query this app leans on constantly ("my rank among my grade+school", "top 10 per grade advancing to next round"). Neon's free tier (0.5GB, autosuspends but **auto-wakes on the next request** — no manual resume step, unlike Supabase's 7-day manual-resume pause) is the better fit for this data shape. Reaching Neon from a Cloudflare Worker needs a driver that works over HTTP/WebSockets (Neon's serverless driver) rather than a raw TCP Postgres connection, since Workers don't support raw TCP sockets — confirm this wiring works cleanly with Drizzle before committing, it's the one integration risk in this stack. |
| ORM | Drizzle | Lighter, faster to iterate under a small/solo team, has first-class support for both Neon's HTTP driver and D1 if we ever need to fall back to it. |
| Auth | **Better Auth** (self-hosted, free, no MAU cap) — via the `better-auth-cloudflare` package, which has a documented, maintained integration path for Next.js + OpenNext + D1/Postgres-via-Hyperdrive on Workers | Clerk/Supabase Auth are generous free tiers today (10k–50k MAU) but are still a third-party dependency with caps that can change; a self-hosted option has zero recurring cost or user-count risk at any scale, and the Cloudflare integration is no longer a DIY effort — there's a maintained package for exactly this stack. |
| File storage | Cloudflare R2 free tier (10GB storage, **zero egress fees** — the actual killer feature vs S3-likes) | Only needed for admin-uploaded JSON/CSV banks and (later) AI source documents; tiny footprint at launch. |
| Email (password reset, verification) | Resend free tier (3,000 emails/mo) | Plenty at pilot scale. |
| Error monitoring | Sentry free tier | Optional but cheap insurance. |
| Question content | **Ship with the human-authored JSON banks the user already has/produces** — no AI dependency required at launch | The user explicitly wants to avoid API costs; the reference PDF's AI-generation costing (~$0.002/question) is genuinely cheap but is an *optional* accelerant for filling out topic coverage later, not a requirement. If used, gate it as an admin-triggered one-off script against Anthropic's API with a human review step before publishing — never auto-publish AI output straight to students. |
| Animation | Framer Motion (React) for transitions/stagger/timer ring; `canvas-confetti` or similar for quiz-end celebration | Both free, MIT-licensed, no runtime cost. |
| Charts (dashboard attempts graph) | Recharts or a lightweight alternative | Matches the line/area chart in the reference screenshots. |

**Realistic monthly cost at pilot scale (few hundred–low thousands of students): $0**,
with the honest caveat that free tiers can need upgrading if traffic spikes (e.g. a
contest round going live and every student hitting it in the same 10-minute window —
worth load-testing the free tier's concurrency limits before a real contest launch, not
after).

## 7. Competitive / research findings

- **Pakistani MCQ landscape** (PAKTIK, PakMcqs, PakTest, CoreMCQs, Graduate.pk) skews
  toward exam-prep (MDCAT/ECAT/board past-papers) with fairly plain, form-like UIs and
  category/grade-wise organization + leaderboards — validates the grade/topic/leaderboard
  structure already planned, but **none of them lean into game-like polish**, which is
  the gap this app can win on for a younger (Grade 1–10) audience.
- **Global gamified-learning leaders** (Kahoot, Quizizz, Blooket, Prodigy Math) point to
  concrete, provably-effective patterns worth adopting beyond "have a leaderboard":
  - Point/streak systems and progress bars measurably increase completion — but
    literature also warns against making external rewards (points/badges) the *only*
    motivator; pair them with genuinely well-written, encouraging "reason" explanations
    so the learning itself stays the point, not just the score.
  - Fast visual feedback (instant green/red, animated point counter) is what makes these
    apps feel responsive/fun rather than exam-like — this app's spec in §4 already leans
    this way; worth protecting that spec from being cut for time.
  - Color-coded, glanceable timers (not just a numeric countdown) read faster for kids —
    already reflected in §4's timer spec.
  - Streaks, badges, and light avatar/customization elements are common next-tier
    additions once the core loop works — good candidates for fast-follow, not launch.

## 8. UI/UX design research — making it "world-class" and fun for kids

The `froze-gecko-44157394.figma.site` reference is **still unreachable (404)** on a
second check — cannot be used as a design input until the user provides a working link
or export. Everything below is instead grounded in what demonstrably works for this
exact audience (children/teens learning academic content), cross-referenced against the
"funky, animated, game-like" brief.

### 8.1 What the best-in-class apps actually do differently from MATHmania
- **Khan Academy Kids** ties every correct answer to an immediate, layered reward: a
  sound cue + a small animation + visual state change, all firing together rather than
  sequentially — this is why it *reads* as instant even though multiple things are
  happening. Its lessons are also intentionally short (3–5 min), which maps well onto our
  fixed 10-question/quiz format — that's already the right length, don't be tempted to
  lengthen it later for "more content" without re-testing engagement.
- **Duolingo-style** apps blend character/mascot animation with the exercise itself
  rather than bolting animation on as decoration — worth considering a simple mascot
  (even just an animated character in the corner reacting to right/wrong answers) as a
  cheap, high-leverage addition beyond what MATHmania has. MATHmania's own site literally
  uses a math pun as personality ("There's a fine line between a numerator and a
  denominator...") — that voice/tone is worth matching or exceeding, not just the UI.
- General principle from the design literature: **every tap needs a reaction** — a
  wiggle, a color shift, a sound, a pop — because for this age group the micro-response
  *is* the confirmation that the app registered the action, not just a nice-to-have.

### 8.2 Concrete UI/UX upgrades to plan for beyond the MATHmania screenshots
- **Landing/auth**: the reference screenshots show a plain, corporate-feeling
  login/signup. Use bold, saturated but not garish color blocking, soft rounded shapes
  (rounded-2xl+ cards, pill buttons — already implied by "funky"), and a subject-mascot
  or illustration rather than a blank form on white.
  - **Onboarding as a mini-game, not a form.** Turn the two-step signup + long profile
    form into a short wizard with one field-group per screen, a progress dots/bar at the
    top, and a little celebratory animation at the end ("You're in! 🎉") — this alone
    would already exceed the plain-form pattern MATHmania and the Pakistani exam-prep
    apps (PAKTIK, PakTest, CoreMCQs) all use.
- **Dashboard**: keep the information architecture from the reference screenshots (rank
  card, best-score ring, attempts chart, contest/practice tables) — it's sound — but
  reskin every stat as an animated, count-up value on load (points, rank, percentage),
  add hover/tap micro-interactions on cards, and replace the plain green chart background
  with a friendlier chart style (soft gradient fill under the line, animated draw-in on
  first render) via Recharts.
- **Quiz screen (highest-leverage surface in the whole app)**:
  - Stagger-in animation for question text then each option (already specified in §4) —
    Framer Motion's `staggerChildren` is a direct fit.
  - **Timer as a circular ring or horizontal bar that visibly depletes**, colour-
    interpolating green → amber → red rather than snapping between three fixed colors —
    reads as more alive and gives a continuous urgency cue instead of a sudden jump.
  - Correct/incorrect state changes should combine a **color transition + a small
    scale/bounce pulse on the selected option** + a short success/error sound (with a
    mute toggle — sound-heavy apps for shared/classroom devices need an easy off switch).
  - Point counter increments with a genuine count-up tween (not an instant number swap),
    plus a small "+10" floating/fading indicator near the counter — a well-worn but
    effective pattern from Duolingo/Kahoot-style apps.
  - "See Reason" should expand/slide open (not just appear) and read in a warm,
    encouraging voice, matching the tone already present in the sample JSON's
    explanations.
  - **End-of-quiz screen**: confetti burst (`canvas-confetti`), animated score reveal
    (count up to final score out of 100), a correct/incorrect breakdown (e.g. a simple
    10-dot or 10-bar row, green/red), and if it's a personal best or rank-up, a distinct
    "new high score" / "rank up" celebratory state — small variation in the celebration
    keeps repeat practice sessions from feeling identical.
- **Leaderboard**: the MATHmania reference is functional but visually flat (plain table,
  pill filters). Consider a **podium treatment for ranks 1–3** (medal icons, slightly
  larger avatar/card) above a normal ranked list for the rest — a extremely common and
  proven leaderboard pattern in Kahoot/Duolingo-style apps that MATHmania's screenshots
  don't use, and a clear opportunity to visually outclass it without much extra work.

### 8.3 Accessibility & readability — non-negotiable given the age range (Grade 1–10)
- **Color contrast**: warm, calming colors (yellow/orange/pink/green) support
  concentration better than cold/stimulating ones (harsh blue/purple/red) for this age
  group per the design literature — use warm tones for primary UI chrome and reserve
  red/green strictly for the correct/incorrect semantic meaning students already expect
  from quiz apps, so color meaning stays consistent and isn't diluted by decorative reuse
  elsewhere on the same screen.
- **Typography**: pick a rounded, highly legible sans-serif (e.g. Nunito, Baloo 2,
  Poppins — common in kids'-app design systems) at a larger base size than a typical SaaS
  app; avoid thin font weights. For Grade 1–3 in particular, generous line-height and
  letter-spacing meaningfully improves readability, and this also happens to be broadly
  dyslexia-friendlier even without switching to a specialist font like OpenDyslexic.
  Given the audience skews young, this is worth treating as a default, not an opt-in
  accessibility mode.
- **Touch/click targets**: given many students will use this on shared or older school
  devices (possibly tablets, possibly older Android phones over a school Wi-Fi), keep
  option buttons and primary CTAs large (44px+ tap targets) and avoid relying on hover-
  only affordances.
- **Motion sensitivity**: respect `prefers-reduced-motion` — swap staggered/bouncy
  animations for simple fades/instant transitions when a user or device requests it, so
  the "fun" doesn't become a barrier for the few students who are motion-sensitive.

### 8.4 Recommended animation/interaction stack (all free, MIT-licensed, no runtime cost)
- **Framer Motion** — page/element transitions, stagger-in, the timer ring's animated
  stroke, count-up number tweens (or pair with a tiny dedicated count-up hook).
- **canvas-confetti** — quiz-complete celebration burst.
- **Lottie** (via `lottie-react`) — optional, for a higher-production mascot/character
  animation if the user wants something beyond CSS/Framer Motion-driven shapes; adds a
  small bundle-size cost so only worth it if a mascot direction is confirmed.
- **Recharts** — dashboard attempts chart, styled to match the funky palette rather than
  left at library defaults.

## 9. Phased build roadmap (planning only — do not start until explicitly told to build)

This sequencing exists so that when implementation is greenlit, the highest-risk,
hardest-to-retrofit pieces (auth, data model, the timer's server-authoritative logic) are
solid before any UI polish work sits on top of them — polishing a quiz screen twice
because the underlying session model changed is the most common way "make it beautiful"
projects like this go over budget.

**Phase 0 — Foundations**: repo scaffold, Next.js + OpenNext Cloudflare adapter wired to
a live Workers deployment (even a "hello world" page) to de-risk the hosting choice
early, Neon Postgres + Drizzle schema for the core tables in §5, Better Auth wired up for
email/password + password reset.

**Phase 1 — Core quiz engine (practice mode only, one grade, one topic)**: question
import from the sample JSON, server-authoritative session/timer logic exactly per §4,
the full quiz UI (reveal, "See Reason", "Next Question", end-of-quiz summary) with the
animation treatment from §8 — this is the phase worth spending the most design iteration
on, since practice and contest share this engine entirely.

**Phase 2 — Student account layer**: full signup wizard (§8.2), profile view/edit,
dashboard with real attempt data, practice attempt history.

**Phase 3 — Contest layer**: rounds, attempt limits, eligibility windows, contest quiz
flow (reuses Phase 1's engine), leaderboard with grade/round filters and the podium
treatment from §8.2.

**Phase 4 — Admin panel**: JSON/CSV question bank upload with the validation rules in
§5, question CRUD, round management, school/user search.

**Phase 5 — Polish & pilot readiness**: mobile-responsiveness pass, accessibility pass
(§8.3), load-test the free-tier hosting/DB limits under simulated contest-launch traffic
(a burst of concurrent students starting a round at once), soft-launch checklist.

**Fast-follow (post-pilot, not blocking launch)**: AI-assisted question generation with
human review queue, bulk CSV student import, anti-cheat flags, Document Verification,
multiple concurrent contest rounds, export tools, additional subjects (English/Urdu/
Science) reusing the same subject-agnostic schema.

## 10. Explicit open questions for the user (don't guess on these before building)

1. Does **Practice** mode affect the leaderboard at all, or is it purely low-stakes
   (matches MATHmania's screenshots, which track practice and contest completely
   separately)?
2. School name: free-text field, or a searchable/typeahead list backed by a growing
   `schools` table (recommended, to keep leaderboard grouping clean)?
3. Attempt limits: same limit for practice and contest, or unlimited practice /
   admin-capped contest attempts (reference dashboard shows a single "Remaining
   Attempts" — clarify if that's contest-only)?
4. Is a "Document Verification" step (seen in the MATHmania profile screenshot) actually
   needed at launch, or later (e.g. only if contests carry real prizes requiring identity
   proof)?
5. The `froze-gecko-44157394.figma.site` reference has now 404'd on **two separate
   checks** — it's very likely dead/expired (Figma "site" prototype links often expire).
   Ask the user for a fresh export/screenshot/link if that reference still matters, or
   confirm the MATHmania screenshots + §8's UI/UX research fully cover the intended look.

## 11. Explicitly out of scope for now

- Mobile app (Flutter or otherwise) — web-only per current direction.
- Subjects other than Math (English/Urdu/Science) — architecture should not block these,
  but no content/UI work for them yet.
- AI-generated question banks as a live admin feature, bulk CSV student import,
  anti-cheat tooling, multiple concurrent contest rounds, export tools — all fast-follow
  per the reference plan, not part of the initial build.

## 12. Sources consulted during this research pass

- [Vercel free tier limits in 2026: what you actually get on Hobby](https://www.promptstoproduct.com/vercel-free-tier-limits)
- [Is Vercel Free? 2026 Pricing, Limits & the 100GB Bandwidth Cap](https://www.pandacodegen.com/blog/nextjs-hosting-zero-cost)
- [Supabase Free Tier Limits in 2026: Hidden Pauses & Caps](https://www.itpathsolutions.com/supabase-free-tier-limits)
- [GitHub: fullstack-next-cloudflare template (Next.js + Workers + D1 + R2 + Better Auth)](https://github.com/ifindev/fullstack-next-cloudflare)
- [Best Cloudflare Pages Alternatives in 2026](https://pandastack.io/blog/best-cloudflare-pages-alternatives-2026)
- [Next.js Auth 2026: Clerk vs Better Auth vs Supabase](https://www.iloveblogs.blog/post/nextjs-authentication-comparison-2026)
- [Better Auth vs Clerk vs NextAuth vs Supabase Auth (2026)](https://www.turbostarter.dev/blog/better-auth-vs-clerk-vs-nextauth-vs-supabase-auth)
- [PAKTIK — Pakistan's #1 Online MCQ Quiz Platform](https://paktik.net/)
- [PakTest Mcqs — Google Play](https://play.google.com/store/apps/details?id=com.edu.paktest)
- [CoreMCQs](https://www.coremcqs.com/)
- [Ultimate Guide to Gamification: Best UX/UI Practices](https://medium.com/brightvibe/ultimate-guide-to-gamification-6c17160f2047)
- [Gamification in Educational Apps to Enhance Learning Experiences — Eastern Peak](https://easternpeak.com/blog/gamification-strategies-in-educational-apps/)
- [Cloudflare: Next.js on Cloudflare Workers docs](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare)
- [Cloudflare blog: Deploying Next.js apps to Cloudflare Workers with the OpenNext adapter](https://blog.cloudflare.com/de-de/deploying-nextjs-apps-to-cloudflare-workers-with-the-opennext-adapter)
- [better-auth-cloudflare (GitHub)](https://github.com/zpg6/better-auth-cloudflare)
- [Cloudflare D1 vs Neon vs Supabase Postgres 2026](https://www.devtoolreviews.com/reviews/cloudflare-d1-vs-neon-vs-supabase-postgres-2026)
- [Cloudflare D1 vs PostgreSQL 2026: Full Comparison](https://www.devtoolreviews.com/reviews/cloudflare-d1-vs-postgres-2026)
- [Architecting on Cloudflare — Chapter 12: D1: SQLite at the Edge](https://architectingoncloudflare.com/chapter-12/)
- [Top 11 Education App Design Trends in 2025 — Lollypop](https://lollypop.design/blog/2025/august/top-education-app-design-trends-2025/)
- [UX Design for Kids: Principles and Recommendations — Ramotion](https://www.ramotion.com/blog/ux-design-for-kids/)
- [Designing for Kids: UX Design Tips for Children Apps — Ungrammary](https://www.ungrammary.com/post/designing-for-kids-ux-design-tips-for-children-apps)
- [UX Design for Kids: The Ultimate Guide — Gapsy Studio](https://gapsystudio.com/blog/ux-design-for-kids/)
- [Using Color Psychology for Education Web Design — Progress](https://www.progress.com/blogs/using-color-psychology-education-web-design)
- [Finding Accessible Fonts for Classroom Use — Two Writing Teachers](https://twowritingteachers.org/2019/11/20/accessible-fonts/)
- Locally provided: `MATHmania-Web-App-2Week-Plan.md.pdf` (2-week Next.js build plan +
  cost estimate, used as the architectural baseline and then adjusted for the $0/month
  constraint above), `grade2_math_mcqs_v2_varied.json` (real sample question bank), and
  screenshots of the live `mathmania.pk/dashboard/` product.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
