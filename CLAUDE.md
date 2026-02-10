# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production (must use webpack flag, not turbopack)
npm start            # Start production server
npm run lint         # Run ESLint
```

### Production Build
**Important**: When building for production, use the webpack flag due to Serwist PWA limitations:
```bash
npm run build -- --webpack
npm start
```

### Supabase Setup
After creating a Supabase project:
1. Run migrations: `supabase/migrations/001_initial_schema.sql` in SQL Editor
2. Create storage bucket named `event-photos` (public, 5MB limit, images only)
3. Run storage policies: `supabase/storage_policies.sql`
4. Enable Anonymous Sign-ins in Authentication > Settings

## Architecture Overview

### Dual Authentication System
The app uses two distinct authentication flows:
- **Host users**: Email/password auth via `/login` and `/signup` for creating/managing events
- **Guest users**: Anonymous auth for frictionless photo uploads (no sign-up required)

Guest authentication is handled client-side in `app/e/[slug]/camera-view.tsx` - it automatically signs in anonymous users on mount.

### Supabase Client Pattern
- **Client-side**: Use `lib/supabase/client.ts` for browser components (marked with "use client")
- **Server-side**: Use `lib/supabase/server.ts` for server components and server actions
- **Server Actions**: Auth actions in `lib/supabase/actions.ts` (signUp, signIn, signOut, signInAnonymously)

### Database Types
TypeScript types are auto-generated in `lib/supabase/types.ts`. Key types:
- `Event`: id, created_at, host_id, name, slug, qr_code_url
- `Photo`: id, created_at, event_id, user_id, storage_path, is_visible

### Real-time Architecture
The live gallery (`app/live/[slug]/live-gallery.tsx`) subscribes to Supabase Realtime for:
- INSERT events: New photos appear instantly
- UPDATE events: Moderation (hide/show) reflects immediately
- DELETE events: Removed photos disappear from gallery

### Storage Architecture
Photos are stored in **Cloudflare R2** (S3-compatible storage) with paths like `{eventSlug}/{userId}-{timestamp}.{ext}`.

**R2 Configuration:**
- Client configuration: `lib/r2/client.ts`
- Server actions: `lib/r2/actions.ts` (upload, delete, batch delete)
- URL utilities: `lib/r2/utils.ts` (getR2PublicUrl)

### R2 Setup
After creating a Cloudflare R2 bucket:
1. Create a public bucket named `event-photos`
2. Generate S3 API tokens (Access Key ID + Secret Access Key)
3. Update `.env.local` with R2 credentials
4. Configure CORS for the bucket to allow uploads from your domain

### App Routes Structure
- `/` - Landing page
- `/login`, `/signup` - Host authentication
- `/dashboard` - Host dashboard for event management
- `/e/[slug]` - Guest camera view (photo upload interface)
- `/live/[slug]` - Projector view (real-time photo gallery)
- `/join` - Event code lookup page

### PWA Configuration
- Service worker source: `app/sw.ts`
- Service worker output: `public/sw.js`
- Manifest: `public/manifest.json`
- Configured via `@serwist/next` in `next.config.ts`
- **Note**: Turbopack is enabled in config but must use webpack for builds due to Serwist limitations

### RLS Policy Structure
Row Level Security policies govern access:
- **Events**: Readable by everyone, editable only by host (host_id = auth.uid())
- **Photos**: Visible photos readable by everyone, uploads by authenticated users (including anonymous), moderation by event hosts

### Environment Variables
Required in `.env.local`:
```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cloudflare R2 Configuration
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_BUCKET=event-photos
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
NEXT_PUBLIC_R2_PUBLIC_URL=https://your-account.r2.cloudflarestorage.com/event-photos
```

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

## Key Implementation Details

### Photo Upload Flow
1. Guest opens `/e/[slug]` page
2. Anonymous auth is auto-triggered if not authenticated
3. User selects/captures photo via file input with `capture="environment"`
4. Photo uploaded to Cloudflare R2 via Server Action `uploadToR2()`
5. Photo metadata inserted into `photos` table with `is_visible = true`
6. Realtime subscription triggers live gallery update on `/live/[slug]`

### Photo Moderation
Hosts can toggle `is_visible` flag on photos via the event management page (`/dashboard/event/[slug]`). This triggers an UPDATE event that propagates via Realtime to hide/show photos on live view.

### Camera Capture
The camera interface uses HTML file input with `capture="environment"` attribute to trigger native camera on mobile devices. PWA install prompt available for installing as home screen app.
