# How Supabase is Used in LiveDrop

This document explains the Supabase integration architecture in the LiveDrop project.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION                           │
├────────────────────────────┬────────────────────────────────────┤
│   Host Auth                │   Guest Auth                       │
│   Email/Password           │   Anonymous Sign-in                │
└────────────────────────────┴────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE CLIENTS                           │
├─────────────────┬─────────────────────┬─────────────────────────┤
│ Browser Client  │   Server Client     │   Server Actions        │
│ client.ts       │   server.ts         │   actions.ts            │
└─────────────────┴─────────────────────┴─────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Database    │     │    Storage    │     │   Realtime    │
│  PostgreSQL   │     │ event-photos  │     │    Photos     │
└───────────────┘     └───────────────┘     └───────────────┘
```

## 1. Dual Client Pattern

The project uses two Supabase clients depending on the execution context:

| Client | File | Usage |
|--------|------|-------|
| **Browser Client** | `lib/supabase/client.ts` | Client-side components marked with `"use client"` (photo uploads, realtime subscriptions) |
| **Server Client** | `lib/supabase/server.ts` | Server components and server actions (uses cookies for auth persistence) |

### Browser Client (`lib/supabase/client.ts`)

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server Client (`lib/supabase/server.ts`)

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) { /* ... */ },
      },
    }
  );
}
```

## 2. Authentication

The app implements a **dual authentication system** in `lib/supabase/actions.ts`:

### Host Authentication (Email/Password)

- **Sign Up**: `signUp(formData)` - Creates account and redirects to `/dashboard`
- **Sign In**: `signIn(formData)` - Authenticates and redirects to `/dashboard`
- **Sign Out**: `signOut()` - Logs out and redirects to `/`

Used on `/login` and `/signup` pages for event hosts.

### Guest Authentication (Anonymous)

- **Anonymous Sign In**: `signInAnonymously()` - Creates anonymous session

Used on `/e/[slug]` (camera view) to allow guests to upload photos without creating an account. The anonymous auth is triggered automatically when a guest opens the camera page.

## 3. Database Schema

Defined in `supabase/migrations/001_initial_schema.sql`:

### Events Table

```sql
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  qr_code_url TEXT
);
```

### Photos Table

```sql
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT true NOT NULL
);
```

### TypeScript Types (`lib/supabase/types.ts`)

```typescript
export type Event = {
  id: string;
  created_at: string;
  host_id: string;
  name: string;
  slug: string;
  qr_code_url: string | null;
};

export type Photo = {
  id: string;
  created_at: string;
  event_id: string;
  user_id: string;
  storage_path: string;
  is_visible: boolean;
};
```

## 4. Row Level Security (RLS) Policies

### Events Table

| Policy | Action | Rule |
|--------|--------|------|
| Everyone can view | SELECT | `true` |
| Hosts can create | INSERT | `auth.uid() = host_id` |
| Hosts can update | UPDATE | `auth.uid() = host_id` |
| Hosts can delete | DELETE | `auth.uid() = host_id` |

### Photos Table

| Policy | Action | Rule |
|--------|--------|------|
| View visible photos | SELECT | `is_visible = true` |
| Authenticated can upload | INSERT | `auth.uid() = user_id` |
| Hosts can moderate | UPDATE | Host owns the event |
| Hosts can delete | DELETE | Host owns the event |

## 5. Storage

Configured in `supabase/storage_policies.sql`:

### Bucket Configuration

- **Name**: `event-photos`
- **Public**: Yes (for image viewing)
- **File Size Limit**: 5MB
- **Allowed MIME Types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

### Storage Path Format

```
event-photos/{eventSlug}/{userId}-{timestamp}.{extension}
```

### Storage Policies

| Policy | Action | Rule |
|--------|--------|------|
| Public read | SELECT | `bucket_id = 'event-photos'` |
| Authenticated upload | INSERT | Authenticated users only |
| Host delete | DELETE | Host owns the event (matched by slug) |

## 6. Realtime Subscriptions

Photos table is enabled for realtime updates:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.photos;
```

### Live Gallery Implementation

The `/live/[slug]` page subscribes to photo changes:

```typescript
supabase
  .channel('photos')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'photos',
    filter: `event_id=eq.${eventId}`
  }, (payload) => {
    // Handle INSERT: Add new photo to gallery
    // Handle UPDATE: Show/hide based on is_visible
    // Handle DELETE: Remove photo from gallery
  })
  .subscribe();
```

## 7. Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 8. Setup Steps

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial_schema.sql` in SQL Editor
3. Create storage bucket `event-photos` (public, 5MB limit, images only)
4. Run `supabase/storage_policies.sql` in SQL Editor
5. Enable Anonymous Sign-ins in Authentication > Settings
6. Copy project URL and anon key to `.env.local`
