"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type MobileNavProps = {
  user: { email?: string } | null;
  translations: {
    dashboard: string;
    login: string;
    getStarted: string;
    joinWithCode: string;
  };
};

export function MobileNav({ user, translations }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-card/60 backdrop-blur-sm transition-colors hover:bg-card md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={cn(
              "fixed inset-y-0 right-0 w-full max-w-xs bg-background shadow-xl",
              "animate-in slide-in-from-right duration-300"
            )}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border/70 p-4">
                <span className="text-lg font-semibold">Menu</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-secondary"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3">
                    <LanguageSwitcher />
                    <span className="text-sm text-muted-foreground">Language</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3">
                    <ThemeToggle className="text-foreground hover:bg-secondary/50" />
                    <span className="text-sm text-muted-foreground">Theme</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/70 p-4">
                <div className="space-y-2">
                  {user ? (
                    <>
                      <Button className="w-full" asChild>
                        <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                          {translations.dashboard}
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full bg-background/80" asChild>
                        <Link href="/join" onClick={() => setIsOpen(false)}>
                          {translations.joinWithCode}
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button className="w-full" asChild>
                        <Link href="/signup" onClick={() => setIsOpen(false)}>
                          {translations.getStarted}
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full bg-background/80" asChild>
                        <Link href="/join" onClick={() => setIsOpen(false)}>
                          {translations.joinWithCode}
                        </Link>
                      </Button>
                      <Button variant="ghost" className="w-full" asChild>
                        <Link href="/login" onClick={() => setIsOpen(false)}>
                          {translations.login}
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
