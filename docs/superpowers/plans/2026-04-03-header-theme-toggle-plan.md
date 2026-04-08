# Header Theme Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the existing theme toggle to the main page headers while keeping dark mode as the default theme.

**Architecture:** Reuse `components/theme-toggle.tsx` instead of adding any new theme logic. Patch each scoped header in place and remove the landing page's hardcoded `dark` wrapper so the global `ThemeProvider` can actually switch themes.

**Tech Stack:** Next.js App Router, React 19, TypeScript, next-themes, Tailwind CSS

---

## File Map

- Modify: `app/page.tsx`
- Modify: `app/dashboard/dashboard-client.tsx`
- Modify: `app/dashboard/loading.tsx`
- Modify: `app/dashboard/event/[slug]/page.tsx`

## Notes

- This repo has no automated test framework configured.
- Verification should use targeted ESLint plus a quick manual browser check.
