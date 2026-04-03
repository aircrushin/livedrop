# Header Theme Toggle Design

## Goal

Add a theme toggle to the main page headers so the app can start in dark mode but still let users switch to light mode from the header.

## Scope

This change only adds the existing `ThemeToggle` UI to header areas that do not already have it.

In scope:

- landing page header
- dashboard list header
- dashboard loading header
- dashboard event detail header

Out of scope:

- `live` gallery header, which already has a theme toggle
- new theme state logic
- refactoring headers into shared abstractions

## Approach

Reuse the existing `components/theme-toggle.tsx` component and place it into each header's existing right-side action group.

Placement rules:

- keep current header layout patterns
- avoid moving primary actions out of place
- keep spacing consistent with each page's current controls

## Files

- `app/page.tsx`
- `app/dashboard/dashboard-client.tsx`
- `app/dashboard/loading.tsx`
- `app/dashboard/event/[slug]/page.tsx`

## Verification

- theme toggle is visible in each scoped header
- dark mode remains the default initial theme
- toggling theme updates page colors without breaking header layout
- `live` page header remains unchanged
