"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "icon" | "full" | "full-dark";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animated?: boolean;
}

const sizeMap = {
  icon: { sm: 28, md: 40, lg: 56, xl: 80 },
  full: { sm: 120, md: 180, lg: 260, xl: 360 },
  "full-dark": { sm: 140, md: 200, lg: 300, xl: 420 },
};

const heightMap = {
  icon: { sm: 28, md: 40, lg: 56, xl: 80 },
  full: { sm: 28, md: 42, lg: 60, xl: 84 },
  "full-dark": { sm: 38, md: 54, lg: 80, xl: 112 },
};

export function Logo({
  variant = "icon",
  size = "md",
  className,
  animated = true,
}: LogoProps) {
  const width = sizeMap[variant][size];
  const height = heightMap[variant][size];

  if (variant === "icon") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        width={width}
        height={height}
        className={cn("shrink-0", className)}
        role="img"
        aria-label="LiveDrop logo"
      >
        <defs>
          <linearGradient id="ld-drop" x1="0.25" y1="0" x2="0.75" y2="1">
            <stop offset="0%" stopColor="#f7e27a" />
            <stop offset="45%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#a8861e" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="#0a0a0a" />
        <path
          d="M256 62 C256 62 416 242 416 338 C416 422 344 482 256 482 C168 482 96 422 96 338 C96 242 256 62 256 62Z"
          fill="url(#ld-drop)"
        />
        <circle cx="256" cy="340" r="80" fill="rgba(10,10,10,0.2)" />
        <circle
          cx="256"
          cy="340"
          r="56"
          fill="none"
          stroke="rgba(10,10,10,0.12)"
          strokeWidth="7"
        />
        <circle cx="256" cy="340" r="28" fill="rgba(10,10,10,0.22)" />
        <ellipse
          cx="220"
          cy="278"
          rx="30"
          ry="16"
          fill="white"
          opacity="0.2"
          transform="rotate(-32 220 278)"
        />
        <circle cx="398" cy="102" r="26" fill="#dc2626" />
        {animated && (
          <circle
            cx="398"
            cy="102"
            r="26"
            fill="none"
            stroke="#dc2626"
            strokeWidth="3.5"
          >
            <animate
              attributeName="r"
              values="26;46"
              dur="1.6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.6;0"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </circle>
        )}
        <circle cx="398" cy="102" r="9" fill="white" opacity="0.92" />
      </svg>
    );
  }

  if (variant === "full") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 520 120"
        width={width}
        height={height}
        className={cn("shrink-0", className)}
        role="img"
        aria-label="LiveDrop logo"
      >
        <defs>
          <linearGradient id="ld-mark" x1="0.25" y1="0" x2="0.75" y2="1">
            <stop offset="0%" stopColor="#f7e27a" />
            <stop offset="45%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#a8861e" />
          </linearGradient>
          <linearGradient id="ld-text" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5f5dc" />
            <stop offset="100%" stopColor="#e8e4c9" />
          </linearGradient>
          <linearGradient id="ld-accent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0d860" />
            <stop offset="100%" stopColor="#d4af37" />
          </linearGradient>
        </defs>
        <path
          d="M48 6 C48 6 90 46 90 68 C90 88 72 102 48 102 C24 102 6 88 6 68 C6 46 48 6 48 6Z"
          fill="url(#ld-mark)"
        />
        <circle cx="48" cy="69" r="19" fill="rgba(10,10,10,0.2)" />
        <circle
          cx="48"
          cy="69"
          r="13"
          fill="none"
          stroke="rgba(10,10,10,0.12)"
          strokeWidth="2"
        />
        <circle cx="48" cy="69" r="6.5" fill="rgba(10,10,10,0.22)" />
        <ellipse
          cx="39"
          cy="54"
          rx="7"
          ry="4"
          fill="white"
          opacity="0.22"
          transform="rotate(-32 39 54)"
        />
        <circle cx="80" cy="18" r="7" fill="#dc2626" />
        {animated && (
          <circle
            cx="80"
            cy="18"
            r="7"
            fill="none"
            stroke="#dc2626"
            strokeWidth="1.5"
          >
            <animate
              attributeName="r"
              values="7;13"
              dur="1.6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.6;0"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </circle>
        )}
        <circle cx="80" cy="18" r="2.5" fill="white" opacity="0.9" />
        <text
          x="108"
          y="73"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
          fontSize="52"
          fontWeight="300"
          fill="url(#ld-text)"
          letterSpacing="-1"
        >
          Live
        </text>
        <text
          x="234"
          y="73"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
          fontSize="52"
          fontWeight="700"
          fill="url(#ld-accent)"
          letterSpacing="-1"
        >
          Drop
        </text>
      </svg>
    );
  }

  // full-dark variant
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 160"
      width={width}
      height={height}
      className={cn("shrink-0", className)}
      role="img"
      aria-label="LiveDrop logo"
    >
      <defs>
        <linearGradient id="ld-markD" x1="0.25" y1="0" x2="0.75" y2="1">
          <stop offset="0%" stopColor="#f7e27a" />
          <stop offset="45%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#a8861e" />
        </linearGradient>
        <linearGradient id="ld-textD" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5f5dc" />
          <stop offset="100%" stopColor="#e8e4c9" />
        </linearGradient>
        <linearGradient id="ld-accentD" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0d860" />
          <stop offset="100%" stopColor="#d4af37" />
        </linearGradient>
      </defs>
      <rect width="600" height="160" rx="24" fill="#0a0a0a" />
      <path
        d="M68 22 C68 22 118 68 118 94 C118 118 96 138 68 138 C40 138 18 118 18 94 C18 68 68 22 68 22Z"
        fill="url(#ld-markD)"
      />
      <circle cx="68" cy="96" r="22" fill="rgba(10,10,10,0.2)" />
      <circle
        cx="68"
        cy="96"
        r="15"
        fill="none"
        stroke="rgba(10,10,10,0.12)"
        strokeWidth="2.5"
      />
      <circle cx="68" cy="96" r="8" fill="rgba(10,10,10,0.22)" />
      <ellipse
        cx="56"
        cy="76"
        rx="8"
        ry="5"
        fill="white"
        opacity="0.2"
        transform="rotate(-32 56 76)"
      />
      <circle cx="106" cy="34" r="8.5" fill="#dc2626" />
      {animated && (
        <circle
          cx="106"
          cy="34"
          r="8.5"
          fill="none"
          stroke="#dc2626"
          strokeWidth="2"
        >
          <animate
            attributeName="r"
            values="8.5;16"
            dur="1.6s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.6;0"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      <circle cx="106" cy="34" r="3" fill="white" opacity="0.9" />
      <line
        x1="140"
        y1="40"
        x2="140"
        y2="120"
        stroke="#262626"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <text
        x="164"
        y="102"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
        fontSize="58"
        fontWeight="300"
        fill="url(#ld-textD)"
        letterSpacing="-1.5"
      >
        Live
      </text>
      <text
        x="304"
        y="102"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
        fontSize="58"
        fontWeight="700"
        fill="url(#ld-accentD)"
        letterSpacing="-1.5"
      >
        Drop
      </text>
      <text
        x="164"
        y="128"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
        fontSize="13"
        fontWeight="400"
        fill="#a3a3a3"
        letterSpacing="3"
        opacity="0.7"
      >
        REAL-TIME EVENT PHOTOS
      </text>
    </svg>
  );
}
