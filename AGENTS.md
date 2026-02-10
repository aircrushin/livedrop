# AGENTS.md

This file provides guidance to AI agents working in this codebase.

## Build/Lint Commands

```bash
# Development
npm run dev                    # Start development server (http://localhost:3000)

# Production build (MUST use webpack flag - Serwist PWA doesn't support Turbopack)
npm run build -- --webpack
npm start                      # Start production server

# Linting
npm run lint                   # Run ESLint (uses eslint-config-next)
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
