# CLAUDE.md

This file provides guidance to AI agents working in this codebase.

## Build/Lint Commands

```bash
# Development
pnpm run dev                    # Start development server (http://localhost:3000)

# Production build (MUST use webpack flag - Serwist PWA doesn't support Turbopack)
pnpm run build -- --webpack
pnpm start                      # Start production server

# Linting
pnpm run lint                   # Run ESLint (uses eslint-config-next)
```

**Note:** No test framework is configured in this project.

## Architecture Overview

- **Framework:** Next.js 16 App Router with React 19
- **Language:** TypeScript (strict mode enabled)
- **Styling:** Tailwind CSS v4 with custom CSS variables
- **Auth:** Supabase (host users: email/password, guests: anonymous)
- **Storage:** Cloudflare R2 (S3-compatible)
- **Database:** Supabase with TypeScript types in `lib/supabase/types.ts`
- **i18n:** next-intl (English/Chinese) - translations in `i18n/messages/`
- **PWA:** Serwist for service worker

## Code Style Guidelines

### Imports
- Use `@/` path alias for all imports (e.g., `@/lib/supabase/server`)
- Import types with `type` keyword: `import type { Event } from "@/lib/supabase/types"`
- Group imports: React/Next first, then external libs, then internal modules

### Components
- Server components by default (no directive needed)
- Add `"use client"` at top for client components
- Add `"use server"` at top for server actions
- Use PascalCase for component names (e.g., `CameraView`)
- Named exports preferred over default exports
- Use `forwardRef` for components that need ref forwarding

### TypeScript
- Strict mode enabled - always define types explicitly
- Use interfaces for object shapes, types for unions
- Database types auto-generated in `lib/supabase/types.ts`
- Use `type` imports when importing only types

### Naming Conventions
- Components: PascalCase (e.g., `PhotoGrid`, `EventCard`)
- Functions: camelCase (e.g., `generateSlug`, `formatDate`)
- Database fields: snake_case
- Constants: UPPER_SNAKE_CASE

### Styling
- Use Tailwind utility classes exclusively
- Custom theme colors via CSS variables in `globals.css`
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Dark theme by default (colors defined in `:root`)

### Error Handling
- Server actions return `{ error: string }` on failure
- Use `notFound()` from next/navigation for 404s
- Redirects use `redirect()` from next/navigation

### Supabase Patterns
- Server components: `import { createClient } from "@/lib/supabase/server"`
- Client components: `import { createClient } from "@/lib/supabase/client"`
- Auth actions in `lib/supabase/actions.ts`

### i18n Patterns
- Server components: `const t = await getTranslations('namespace')`
- Translations in `i18n/messages/{locale}.json`
- Locale detection in `i18n/request.ts`

## Project Structure

```
app/              # Next.js App Router
  e/[slug]/       # Guest camera view (photo upload)
  live/[slug]/    # Real-time gallery (projector view)
  dashboard/      # Host management interface
  layout.tsx      # Root layout with providers
components/
  ui/             # Reusable UI components (Button, Input, etc.)
lib/
  supabase/       # Supabase clients and actions
  r2/             # Cloudflare R2 storage utilities
  utils.ts        # Helper functions (cn, generateSlug, formatDate)
i18n/
  messages/       # Translation files
  request.ts      # Locale detection
```

## Important Notes

1. **Build requirement:** Always use `--webpack` flag for production builds
2. **Anonymous auth:** Guest users are auto-signed in via `signInAnonymously()`
3. **Real-time:** Live gallery uses Supabase Realtime subscriptions
4. **Photo flow:** Upload to R2 → Insert metadata → Realtime update
5. **Moderation:** Hosts toggle `is_visible` flag; changes propagate via Realtime


## Skills
A skill is a set of local instructions to follow that is stored in a `SKILL.md` file. Below is the list of skills that can be used. Each entry includes a name, description, and file path so you can open the source for full instructions when using a specific skill.
### Available skills
- playwright: Use when the task requires automating a real browser from the terminal (navigation, form filling, snapshots, screenshots, data extraction, UI-flow debugging) via `playwright-cli` or the bundled wrapper script. (file: /Users/mac/.codex/skills/playwright/SKILL.md)
- screenshot: Use when the user explicitly asks for a desktop or system screenshot (full screen, specific app or window, or a pixel region), or when tool-specific capture capabilities are unavailable and an OS-level capture is needed. (file: /Users/mac/.codex/skills/screenshot/SKILL.md)
- ui-ux-pro-max: UI/UX design intelligence. 50 styles, 21 palettes, 50 font pairings, 20 charts, 9 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Elements: button, modal, navbar, sidebar, card, table, form, chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient. Integrations: shadcn/ui MCP for component search and examples. (file: /Users/mac/.codex/skills/ui-ux-pro-max/SKILL.md)
- ui-ux-pro-max: UI/UX design intelligence. 50 styles, 21 palettes, 50 font pairings, 20 charts, 9 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Elements: button, modal, navbar, sidebar, card, table, form, chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient. Integrations: shadcn/ui MCP for component search and examples. (file: /Users/mac/.codex/skills/ui-ux-pro-max.bak-20260205-122747/SKILL.md)
### How to use skills
- Discovery: The list above is the skills available in this session (name + description + file path). Skill bodies live on disk at the listed paths.
- Trigger rules: If the user names a skill (with `$SkillName` or plain text) OR the task clearly matches a skill's description shown above, you must use that skill for that turn. Multiple mentions mean use them all. Do not carry skills across turns unless re-mentioned.
- Missing/blocked: If a named skill isn't in the list or the path can't be read, say so briefly and continue with the best fallback.
- How to use a skill (progressive disclosure):
  1) After deciding to use a skill, open its `SKILL.md`. Read only enough to follow the workflow.
  2) When `SKILL.md` references relative paths (e.g., `scripts/foo.py`), resolve them relative to the skill directory listed above first, and only consider other paths if needed.
  3) If `SKILL.md` points to extra folders such as `references/`, load only the specific files needed for the request; don't bulk-load everything.
  4) If `scripts/` exist, prefer running or patching them instead of retyping large code blocks.
  5) If `assets/` or templates exist, reuse them instead of recreating from scratch.
- Coordination and sequencing:
  - If multiple skills apply, choose the minimal set that covers the request and state the order you'll use them.
  - Announce which skill(s) you're using and why (one short line). If you skip an obvious skill, say why.
- Context hygiene:
  - Keep context small: summarize long sections instead of pasting them; only load extra files when needed.
  - Avoid deep reference-chasing: prefer opening only files directly linked from `SKILL.md` unless you're blocked.
  - When variants exist (frameworks, providers, domains), pick only the relevant reference file(s) and note that choice.
- Safety and fallback: If a skill can't be applied cleanly (missing files, unclear instructions), state the issue, pick the next-best approach, and continue.


## Skills
A skill is a set of local instructions to follow that is stored in a `SKILL.md` file. Below is the list of skills that can be used. Each entry includes a name, description, and file path so you can open the source for full instructions when using a specific skill.
### Available skills
- doc: Use when the task involves reading, creating, or editing `.docx` documents, especially when formatting or layout fidelity matters; prefer `python-docx` plus the bundled `scripts/render_docx.py` for visual checks. (file: /Users/mac/.codex/skills/doc/SKILL.md)
- playwright: Use when the task requires automating a real browser from the terminal (navigation, form filling, snapshots, screenshots, data extraction, UI-flow debugging) via `playwright-cli` or the bundled wrapper script. (file: /Users/mac/.codex/skills/playwright/SKILL.md)
- screenshot: Use when the user explicitly asks for a desktop or system screenshot (full screen, specific app or window, or a pixel region), or when tool-specific capture capabilities are unavailable and an OS-level capture is needed. (file: /Users/mac/.codex/skills/screenshot/SKILL.md)
- ui-ux-pro-max: UI/UX design intelligence. 50 styles, 21 palettes, 50 font pairings, 20 charts, 9 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Elements: button, modal, navbar, sidebar, card, table, form, chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient. Integrations: shadcn/ui MCP for component search and examples. (file: /Users/mac/.codex/skills/ui-ux-pro-max/SKILL.md)
- ui-ux-pro-max: UI/UX design intelligence. 50 styles, 21 palettes, 50 font pairings, 20 charts, 9 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Elements: button, modal, navbar, sidebar, card, table, form, chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient. Integrations: shadcn/ui MCP for component search and examples. (file: /Users/mac/.codex/skills/ui-ux-pro-max.bak-20260205-122747/SKILL.md)
- skill-creator: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Codex's capabilities with specialized knowledge, workflows, or tool integrations. (file: /Users/mac/.codex/skills/.system/skill-creator/SKILL.md)
- skill-installer: Install Codex skills into $CODEX_HOME/skills from a curated list or a GitHub repo path. Use when a user asks to list installable skills, install a curated skill, or install a skill from another repo (including private repos). (file: /Users/mac/.codex/skills/.system/skill-installer/SKILL.md)
### How to use skills
- Discovery: The list above is the skills available in this session (name + description + file path). Skill bodies live on disk at the listed paths.
- Trigger rules: If the user names a skill (with `$SkillName` or plain text) OR the task clearly matches a skill's description shown above, you must use that skill for that turn. Multiple mentions mean use them all. Do not carry skills across turns unless re-mentioned.
- Missing/blocked: If a named skill isn't in the list or the path can't be read, say so briefly and continue with the best fallback.
- How to use a skill (progressive disclosure):
  1) After deciding to use a skill, open its `SKILL.md`. Read only enough to follow the workflow.
  2) When `SKILL.md` references relative paths (e.g., `scripts/foo.py`), resolve them relative to the skill directory listed above first, and only consider other paths if needed.
  3) If `SKILL.md` points to extra folders such as `references/`, load only the specific files needed for the request; don't bulk-load everything.
  4) If `scripts/` exist, prefer running or patching them instead of retyping large code blocks.
  5) If `assets/` or templates exist, reuse them instead of recreating from scratch.
- Coordination and sequencing:
  - If multiple skills apply, choose the minimal set that covers the request and state the order you'll use them.
  - Announce which skill(s) you're using and why (one short line). If you skip an obvious skill, say why.
- Context hygiene:
  - Keep context small: summarize long sections instead of pasting them; only load extra files when needed.
  - Avoid deep reference-chasing: prefer opening only files directly linked from `SKILL.md` unless you're blocked.
  - When variants exist (frameworks, providers, domains), pick only the relevant reference file(s) and note that choice.
- Safety and fallback: If a skill can't be applied cleanly (missing files, unclear instructions), state the issue, pick the next-best approach, and continue.
