"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LiveDropLogoProps {
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  subtitleClassName?: string;
  subtitle?: string;
  priority?: boolean;
}

export function LiveDropLogo({
  className,
  iconClassName,
  labelClassName,
  subtitleClassName,
  subtitle,
  priority = false,
}: LiveDropLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/icons/icon-dark.svg"
        alt="LiveDrop icon"
        width={40}
        height={40}
        className={cn("h-10 w-10 rounded-2xl shrink-0", iconClassName)}
        priority={priority}
      />
      <div>
        <p className={cn("text-xs text-muted-foreground uppercase tracking-wide", labelClassName)}>
          LiveDrop
        </p>
        {subtitle ? <p className={cn("font-bold text-lg", subtitleClassName)}>{subtitle}</p> : null}
      </div>
    </div>
  );
}
