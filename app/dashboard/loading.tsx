import Link from "next/link";
import { LiveDropLogo } from "@/components/livedrop-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <LiveDropLogo />
            </Link>
            <ThemeToggle className="text-foreground hover:bg-secondary/50" />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    </div>
  );
}
