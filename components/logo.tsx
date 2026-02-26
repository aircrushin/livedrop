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
        viewBox="0 0 104 76"
        width={width}
        height={height}
        className={cn("shrink-0", className)}
        role="img"
        aria-label="LiveDrop logo"
      >
        <defs>
          <linearGradient id="ld-icon-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f7e27a" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#a8861e" />
          </linearGradient>
        </defs>
        {/* Camera body */}
        <rect
          x="0"
          y="8"
          width="104"
          height="68"
          rx="18"
          fill="none"
          stroke="rgba(250,250,248,0.08)"
          strokeWidth="1.5"
        />
        {/* Gradient lens ring */}
        <circle
          cx="52"
          cy="42"
          r="22"
          fill="none"
          stroke="url(#ld-icon-mark)"
          strokeWidth="6"
        />
        {/* Inner lens */}
        <circle cx="52" cy="42" r="12" fill="rgba(15,23,42,0.9)" />
        {/* Lens highlight */}
        <ellipse
          cx="46"
          cy="36"
          rx="6"
          ry="4"
          fill="#fefce8"
          opacity="0.32"
          transform="rotate(-25 46 36)"
        />
        {/* Top bar */}
        <rect
          x="14"
          y="2"
          width="38"
          height="10"
          rx="4"
          fill="rgba(248,250,252,0.12)"
        />
        {/* Live red dot */}
        <circle cx="92" cy="16" r="6.5" fill="#dc2626" />
        {animated && (
          <circle
            cx="92"
            cy="16"
            r="6.5"
            fill="none"
            stroke="#dc2626"
            strokeWidth="1.5"
          >
            <animate
              attributeName="r"
              values="6.5;11"
              dur="1.6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.7;0"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </circle>
        )}
        <circle cx="92" cy="16" r="2.3" fill="#fee2e2" opacity="0.9" />
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

  // full-dark variant - updated to match logo-dark.svg style without background
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
        <linearGradient id="ld-markD" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7e27a" />
          <stop offset="50%" stopColor="#d4af37" />
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

      {/* Mark: Rounded camera with live dot */}
      <g transform="translate(32 22)">
        {/* Camera body */}
        <rect
          x="0"
          y="8"
          width="104"
          height="68"
          rx="18"
          fill="none"
          stroke="rgba(250,250,248,0.08)"
          strokeWidth="1.5"
        />
        {/* Gradient lens ring */}
        <circle
          cx="52"
          cy="42"
          r="22"
          fill="none"
          stroke="url(#ld-markD)"
          strokeWidth="6"
        />
        {/* Inner lens */}
        <circle cx="52" cy="42" r="12" fill="rgba(15,23,42,0.9)" />
        {/* Lens highlight */}
        <ellipse
          cx="46"
          cy="36"
          rx="6"
          ry="4"
          fill="#fefce8"
          opacity="0.32"
          transform="rotate(-25 46 36)"
        />
        {/* Top bar */}
        <rect
          x="14"
          y="2"
          width="38"
          height="10"
          rx="4"
          fill="rgba(248,250,252,0.12)"
        />
        {/* Live red dot */}
        <circle cx="92" cy="16" r="6.5" fill="#dc2626" />
        {animated && (
          <circle
            cx="92"
            cy="16"
            r="6.5"
            fill="none"
            stroke="#dc2626"
            strokeWidth="1.5"
          >
            <animate
              attributeName="r"
              values="6.5;11"
              dur="1.6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.7;0"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </circle>
        )}
        <circle cx="92" cy="16" r="2.3" fill="#fee2e2" opacity="0.9" />
      </g>

      {/* Wordmark */}
      <g transform="translate(156 0)">
        {/* Main text */}
        <text
          x="0"
          y="70"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
          fontSize="50"
          fontWeight="300"
          fill="url(#ld-textD)"
          letterSpacing="-1.2"
        >
          <tspan fontWeight="300">Live</tspan>
          <tspan fontWeight="700" fill="url(#ld-accentD)">
            Drop
          </tspan>
        </text>
        {/* Underline accent */}
        <rect
          x="2"
          y="80"
          width="148"
          height="3"
          rx="1.5"
          fill="rgba(148,163,184,0.35)"
        />
        <rect
          x="2"
          y="80"
          width="82"
          height="3"
          rx="1.5"
          fill="url(#ld-accentD)"
        />
        {/* Tagline */}
        <text
          x="2"
          y="102"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
          fontSize="11"
          fontWeight="400"
          fill="#a1a1aa"
          letterSpacing="3"
        >
          REAL-TIME EVENT PHOTOS
        </text>
      </g>
    </svg>
  );
}
