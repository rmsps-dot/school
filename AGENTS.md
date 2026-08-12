<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:rmsps-working-rules -->
# RMSPS Working Rules

This is a production school ERP (Next.js 16 / React 19 / TypeScript / Supabase / Tailwind, deployed on Vercel). Follow these rules on every task, every session, regardless of which model is active.

## Non-negotiable rules
1. Never delete or silently disable an existing feature — migrate it forward instead.
2. Never leave the app in a more broken state than you found it. Verify every touched file still compiles and all existing behavior still works, unless that behavior IS the bug being fixed.
3. Ship complete files only — no `// rest unchanged`, no TODOs, no placeholders.
4. No `any`, no `@ts-ignore`. Fix the actual type.
5. Page files (`app/**/page.tsx`) stay self-contained — only import from `@/lib/supabase/client`, `next/*`, `react`, `lucide-react`, unless a new import is explicitly flagged and approved first.
6. Supabase joined/related data returns arrays even for single relations — always access with `?.[0]?.field`, never assume a plain object.
7. Surgical changes only — fixing X is not license to refactor nearby Y. Flag it instead, don't touch it without approval.
8. Clean up dead code your own edit creates — no leftover old versions "just in case."
9. One logical unit of work per step — one bug, one file, one clear diff. Never batch unrelated fixes.
10. A task isn't done until it passes the checklist below.

## Pre-flight checklist (before calling anything "done")
- Builds/typechecks with zero new errors
- The exact reported issue is fixed
- No previously-working route/component/query is now broken
- No file outside the stated scope was touched
- Dead code created by this change is removed
- No `any`/`@ts-ignore` introduced
- Give a 2-4 line summary: what changed, why, which files

## Communication rules
- Before any multi-file or architectural change: describe the plan and wait for explicit approval — don't start editing on your own judgment.
- Never guess on ambiguous decisions (a database field, business rule, expected value) — stop and ask.
- After each change: a short summary is enough, not a wall of code, unless a full diff is requested.
- Always show the exact output of git commands (especially push) without being asked.

## Design system (established brand — do not substitute)
Colors: `--ink` #0B0B10, `--parchment` #F3EFE6, `--coral` #F1917D, `--gold` #D4AF6A, `--veena-blue` #3E5C76, `--mist` #8A8F98.
Fonts: Syne (display), DM Sans (body), JetBrains Mono (data/code) — loaded via `next/font/google`, never CSS `@import`.
Motion (GSAP/Framer Motion): reserved for the landing page and existing showcase moments — not a default for admin/CRUD screens.
<!-- END:rmsps-working-rules -->
