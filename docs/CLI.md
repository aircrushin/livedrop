# LiveDrop CLI

The CLI is a small admin control plane for developers and AI agents. It reads `.env` and `.env.local`, uses the Supabase service role key for database operations, and uses R2 credentials for object deletion and health checks.

## Setup

Add the service role key to your local environment:

```env
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Then run:

```bash
pnpm cli doctor --json
```

## Agent-Friendly Conventions

- Use `--json` for stable `{ ok, data }` and `{ ok, code, message, details }` envelopes.
- Use `--dry-run` before write operations when planning changes.
- Destructive photo deletion requires `--yes` unless `--dry-run` is present.
- Event targets accept either event `slug` or `id`.

## Commands

```bash
pnpm cli doctor [--json]
pnpm cli events list [--limit 50] [--json]
pnpm cli events get <slug-or-id> [--json]
pnpm cli events create --name <name> --host-id <uuid> [--slug <slug>] [--dry-run] [--json]
pnpm cli events set-active <slug-or-id> <true|false> [--dry-run] [--json]
pnpm cli events set-mode <slug-or-id> <live|kickoff> [--dry-run] [--json]
pnpm cli photos list --event <slug-or-id> [--visible true|false] [--limit 100] [--json]
pnpm cli photos hide <photo-id> [--dry-run] [--json]
pnpm cli photos show <photo-id> [--dry-run] [--json]
pnpm cli photos delete <photo-id> (--yes|--dry-run) [--json]
pnpm cli export event <slug-or-id> [--json]
```

## Examples

```bash
pnpm cli events create --name "Demo Event" --host-id <uuid> --dry-run --json
pnpm cli events set-active demo-event true --json
pnpm cli photos list --event demo-event --visible false --json
pnpm cli photos delete <photo-id> --dry-run --json
pnpm cli export event demo-event --json
```
