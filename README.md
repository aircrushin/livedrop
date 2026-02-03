# LiveDrop

Real-time event photo sharing platform. Create a live photo wall for your event - guests scan a QR code, snap photos, and watch them appear on the big screen instantly.

## Features

- **Zero-Friction Entry**: Guests scan a QR code and start taking photos immediately (anonymous auth)
- **Real-time Gallery**: Photos appear on the projector view instantly via Supabase Realtime
- **PWA Support**: Installable as a native-like app on mobile devices
- **Host Dashboard**: Create events, generate QR codes, moderate photos
- **Offline Resilience**: Built with service workers for reliable uploads

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Auth**: Supabase Auth (Email + Anonymous)
- **PWA**: Serwist (Service Workers)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### 1. Clone and Install

```bash
git clone <repo-url>
cd livedrop
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration in `supabase/migrations/001_initial_schema.sql`
3. Create a storage bucket named `event-photos` with:
   - Public access enabled
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
4. Run the storage policies in `supabase/storage_policies.sql`
5. Enable Anonymous Sign-ins in Authentication > Settings > Auth Providers

### 3. Configure Environment

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Build for Production

```bash
npm run build -- --webpack
npm start
```

## Usage

### As a Host

1. Sign up with email/password
2. Create a new event from the dashboard
3. Share the QR code with guests
4. Open the "Live View" on a projector or big screen
5. Moderate photos from the event management page

### As a Guest

1. Scan the QR code or enter the event code
2. The app will open in your browser (no download needed)
3. Take photos using the camera interface
4. Watch your photos appear on the big screen!

## Project Structure

```
livedrop/
├── app/
│   ├── dashboard/        # Host dashboard
│   ├── e/[slug]/         # Guest camera view
│   ├── live/[slug]/      # Projector view
│   ├── login/            # Auth pages
│   ├── signup/
│   └── join/             # Join event with code
├── components/
│   ├── ui/               # Reusable UI components
│   └── pwa-install-prompt.tsx
├── lib/
│   ├── supabase/         # Supabase client & types
│   └── utils.ts
├── public/
│   ├── icons/            # PWA icons
│   └── manifest.json
└── supabase/
    └── migrations/       # Database schema
```

## Deployment

Deploy to Vercel:

```bash
vercel
```

Make sure to add your environment variables in the Vercel dashboard.

## License

MIT
