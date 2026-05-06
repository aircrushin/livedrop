import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CopyCheck,
  FileJson,
  KeyRound,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { LiveDropLogo } from "@/components/livedrop-logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "CLI Guide",
  description:
    "LiveDrop CLI usage guide for AI agents and local admin workflows.",
};

const quickCommands = [
  {
    label: "健康检查",
    command: "pnpm cli doctor --json",
    note: "确认 Supabase、R2 和必要环境变量是否就绪。",
  },
  {
    label: "活动列表",
    command: "pnpm cli events list --json",
    note: "返回最近活动及 guest/live/dashboard URL。",
  },
  {
    label: "活动详情",
    command: "pnpm cli events get <slug-or-id> --json",
    note: "读取活动配置、状态和照片/观众计数。",
  },
  {
    label: "导出上下文",
    command: "pnpm cli export event <slug-or-id> --json",
    note: "一次拿到 event、photos、viewers、members，适合 agent 分析。",
  },
];

const workflows = [
  {
    title: "创建活动前预览",
    commands: [
      'pnpm cli events create --name "Demo Event" --host-id <uuid> --dry-run --json',
      'pnpm cli events create --name "Demo Event" --host-id <uuid> --slug demo-event --json',
    ],
  },
  {
    title: "切换现场状态",
    commands: [
      "pnpm cli events set-active demo-event true --json",
      "pnpm cli events set-mode demo-event live --json",
    ],
  },
  {
    title: "审核照片",
    commands: [
      "pnpm cli photos list --event demo-event --visible false --json",
      "pnpm cli photos hide <photo-id> --json",
      "pnpm cli photos show <photo-id> --json",
    ],
  },
  {
    title: "删除照片",
    commands: [
      "pnpm cli photos delete <photo-id> --dry-run --json",
      "pnpm cli photos delete <photo-id> --yes --json",
    ],
  },
];

const commandGroups = [
  {
    name: "Doctor",
    commands: ["pnpm cli doctor [--json]"],
  },
  {
    name: "Events",
    commands: [
      "pnpm cli events list [--limit 50] [--json]",
      "pnpm cli events get <slug-or-id> [--json]",
      "pnpm cli events create --name <name> --host-id <uuid> [--slug <slug>] [--dry-run] [--json]",
      "pnpm cli events set-active <slug-or-id> <true|false> [--dry-run] [--json]",
      "pnpm cli events set-mode <slug-or-id> <live|kickoff> [--dry-run] [--json]",
    ],
  },
  {
    name: "Photos",
    commands: [
      "pnpm cli photos list --event <slug-or-id> [--visible true|false] [--limit 100] [--json]",
      "pnpm cli photos hide <photo-id> [--dry-run] [--json]",
      "pnpm cli photos show <photo-id> [--dry-run] [--json]",
      "pnpm cli photos delete <photo-id> (--yes|--dry-run) [--json]",
    ],
  },
  {
    name: "Export",
    commands: ["pnpm cli export event <slug-or-id> [--json]"],
  },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border/80 bg-background/80 p-4 text-sm leading-6 text-primary shadow-inner">
      <code>{children}</code>
    </pre>
  );
}

export default function CliGuidePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(hsl(var(--foreground)/0.14)_1px,transparent_1px)] bg-size-[22px_22px] opacity-35" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-linear-to-b from-accent/12 to-transparent" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Back to LiveDrop home">
            <LiveDropLogo subtitle="CLI Guide" priority />
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Link>
          </Button>
        </header>

        <section className="grid gap-10 pb-14 pt-16 lg:grid-cols-[minmax(0,0.96fr)_360px] lg:pt-20">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              <Terminal className="h-3.5 w-3.5" />
              Agent-ready admin CLI
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
              用命令行管理活动现场。
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              CLI 面向 AI agent 和本地管理员：输出结构化 JSON，写操作支持
              dry-run，
              删除操作带显式确认，方便自动化检查、创建活动、审核照片和导出现场上下文。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <a href="#quickstart" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  快速开始
                </a>
              </Button>
              <Button variant="secondary" asChild>
                <a href="#commands" className="gap-2">
                  <FileJson className="h-4 w-4" />
                  命令速查
                </a>
              </Button>
            </div>
          </div>

          <aside className="self-start rounded-lg border border-border/80 bg-card/80 p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <p className="text-sm font-semibold text-foreground">
              最短可用路径
            </p>
            <div className="mt-4 space-y-4">
              <CodeBlock>{`SUPABASE_SERVICE_ROLE_KEY=...\npnpm cli doctor --json\npnpm cli events list --json`}</CodeBlock>
              <p className="text-sm leading-6 text-muted-foreground">
                `doctor` 不会因为缺配置直接中断；它会返回每一项检查结果，适合
                agent 判断下一步。
              </p>
            </div>
          </aside>
        </section>

        <section
          id="quickstart"
          className="grid gap-5 border-y border-border/70 py-10 md:grid-cols-3"
        >
          <div className="md:pr-8">
            <KeyRound className="mb-4 h-5 w-5 text-accent" />
            <h2 className="text-2xl font-semibold tracking-tight">环境变量</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              CLI 会读取 `.env` 和 `.env.local`。管理命令需要 Supabase service
              role key。
            </p>
          </div>
          <div className="md:col-span-2">
            <CodeBlock>{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nSUPABASE_SERVICE_ROLE_KEY=your-service-role-key\nR2_ACCESS_KEY_ID=your-r2-access-key-id\nR2_SECRET_ACCESS_KEY=your-r2-secret-access-key\nR2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com\nR2_BUCKET=event-photos`}</CodeBlock>
          </div>
        </section>

        <section className="py-12">
          <div className="mb-7 flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                常用命令
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                这些命令覆盖 agent 最常见的检查、读取和导出任务。
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {quickCommands.map((item) => (
              <article
                key={item.command}
                className="rounded-lg border border-border/80 bg-card/65 p-5"
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h3 className="font-semibold">{item.label}</h3>
                  <CopyCheck className="h-4 w-4 text-accent" />
                </div>
                <CodeBlock>{item.command}</CodeBlock>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.note}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 py-10 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">输出协议</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              `--json` 始终返回 envelope。agent 只需要先判断 `ok`，再读取 `data`
              或 `code/message/details`。
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <CodeBlock>{`{\n  "ok": true,\n  "data": {\n    "slug": "demo-event",\n    "urls": {\n      "guest": "http://localhost:3000/e/demo-event",\n      "live": "http://localhost:3000/live/demo-event"\n    }\n  }\n}`}</CodeBlock>
            <CodeBlock>{`{\n  "ok": false,\n  "code": "EVENT_NOT_FOUND",\n  "message": "Event not found",\n  "details": {\n    "target": "demo-event"\n  }\n}`}</CodeBlock>
          </div>
        </section>

        <section className="py-12">
          <h2 className="text-2xl font-semibold tracking-tight">工作流范例</h2>
          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            {workflows.map((workflow) => (
              <article
                key={workflow.title}
                className="rounded-lg border border-border/80 bg-card/65 p-5"
              >
                <h3 className="mb-4 font-semibold">{workflow.title}</h3>
                <div className="space-y-3">
                  {workflow.commands.map((command) => (
                    <CodeBlock key={command}>{command}</CodeBlock>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="commands"
          className="grid gap-8 border-t border-border/70 py-12 lg:grid-cols-[320px_minmax(0,1fr)]"
        >
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              完整命令表
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              事件目标支持 slug 或 id。写操作可以先加 `--dry-run`，确认 payload
              后再执行。
            </p>
          </div>
          <div className="space-y-5">
            {commandGroups.map((group) => (
              <article
                key={group.name}
                className="rounded-lg border border-border/80 bg-card/65 p-5"
              >
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-accent">
                  {group.name}
                </h3>
                <div className="space-y-3">
                  {group.commands.map((command) => (
                    <CodeBlock key={command}>{command}</CodeBlock>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-12 rounded-lg border border-destructive/30 bg-destructive/8 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <ShieldAlert className="h-5 w-5 shrink-0 text-destructive" />
            <div>
              <h2 className="font-semibold">危险操作保护</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                `photos delete` 会先删除 R2
                object，再删除数据库记录。正式执行必须传
                `--yes`，排查或计划阶段请使用 `--dry-run`。
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
