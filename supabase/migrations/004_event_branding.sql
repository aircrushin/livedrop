-- Add branding configuration to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{
  "logoUrl": null,
  "bannerUrl": null,
  "logoPosition": "center",
  "qrStyle": "default",
  "primaryColor": "#3b82f6",
  "backgroundColor": "#ffffff"
}';

-- Update RLS policies to allow hosts to update branding
-- (Already covered by existing host update policy, but let's ensure it)
COMMENT ON COLUMN public.events.branding IS 'Event branding configuration including logo, banner, colors, and QR style';
