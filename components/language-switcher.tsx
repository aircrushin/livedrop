"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const locales = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
];

function setLocaleCookie(locale: string) {
  document.cookie = `locale=${locale};path=/;max-age=31536000`;
}

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  function switchLocale(newLocale: string) {
    setLocaleCookie(newLocale);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Globe className="h-4 w-4" />
          <span className="text-sm">{locales.find((l) => l.code === locale)?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => switchLocale(l.code)}
            className={locale === l.code ? "bg-accent/10 font-medium" : ""}
          >
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
