# LiveDrop Email Templates

Custom email templates for Supabase Auth, matching the LiveDrop dark theme with beige (#f5f5dc) and gold (#d4af37) accents.

## Templates Included

| Template | Purpose |
|----------|---------|
| `invitation.html` | New user invitation emails |
| `confirmation.html` | Email confirmation after signup |
| `magic_link.html` | Passwordless sign-in links |
| `recovery.html` | Password reset requests |
| `email_change.html` | Email address change confirmation |

## Setup Instructions

### Option 1: Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**
4. For each template type:
   - Copy the corresponding HTML file content
   - Paste into the template editor
   - Click **Save**

### Option 2: Using Supabase CLI

1. Ensure you have the Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Update templates via API or use the dashboard method above.

## Design Features

- **Dark Theme**: Deep black (#0a0a0a) background with subtle card (#141414)
- **Brand Colors**: Beige (#f5f5dc) and gold (#d4af37) gradient accents
- **Responsive**: Optimized for both desktop and mobile email clients
- **Accessibility**: High contrast text, clear call-to-action buttons
- **Fallback URLs**: Plain text link provided for email clients that block buttons

## Template Variables

Supabase provides these variables in each template:

| Variable | Description |
|----------|-------------|
| `{{ .SiteURL }}` | Your application's base URL |
| `{{ .ConfirmationURL }}` | The action link (confirm, reset, etc.) |
| `{{ .Email }}` | User's email address |
| `{{ .Token }}` | The verification token |

## Testing

To preview templates locally:

1. Open any `.html` file in a browser
2. Replace template variables with test values:
   - `{{ .SiteURL }}` → `https://livedrop.io`
   - `{{ .ConfirmationURL }}` → `https://livedrop.io/auth/callback?token=test`

## Customization

### Change Brand Colors

Edit the CSS variables in each template:

```css
background-color: #0a0a0a;  /* Main background */
color: #fafafa;              /* Text color */
background: linear-gradient(135deg, #f5f5dc 0%, #d4af37 100%);  /* Button gradient */
```

### Change Logo

Replace the emoji logo with your actual logo:

```html
<div class="logo">
  <img src="https://your-cdn.com/logo.png" alt="LiveDrop" width="40" height="40">
</div>
```

Or update the emoji:
```html
<div class="logo">📸</div>  <!-- Change to your preferred emoji -->
```

## Notes

- Templates use inline CSS for maximum email client compatibility
- Gmail, Outlook, Apple Mail, and mobile clients are all supported
- The golden gradient button is designed to stand out against the dark background
