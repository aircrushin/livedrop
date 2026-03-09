"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import QRCode from "react-qr-code";

interface BrandingConfig {
  logoUrl?: string | null;
  bannerUrl?: string | null;
  logoPosition?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  primaryColor?: string;
  backgroundColor?: string;
}

interface DownloadQRButtonProps {
  url: string;
  eventName: string;
  slug: string;
  branding?: BrandingConfig;
}

/**
 * Convert an R2 public URL to the internal proxy path so the canvas
 * loads images from the same origin (no CORS issues).
 * e.g. https://pub-xxx.r2.dev/branding/abc/logo.png → /api/image/branding/abc/logo.png
 */
function toProxiedUrl(url: string): string {
  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
  if (r2Base && url.startsWith(r2Base)) {
    const path = url.slice(r2Base.length).replace(/^\//, "");
    return `/api/image/${path}`;
  }
  // Fallback: extract path from any r2.dev or r2.cloudflarestorage.com URL
  try {
    const { pathname } = new URL(url);
    if (pathname && pathname.length > 1) {
      return `/api/image${pathname}`;
    }
  } catch {
    // not a valid URL, use as-is
  }
  return url;
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const proxied = toProxiedUrl(src);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = proxied;
  });

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function DownloadQRButton({ url, eventName, slug, branding: initialBranding }: DownloadQRButtonProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Keep branding in sync with updates saved by BrandingSettings on the same page
  const [branding, setBranding] = useState<BrandingConfig | undefined>(initialBranding);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<BrandingConfig>).detail;
      if (detail) setBranding(detail);
    };
    window.addEventListener("branding:updated", handler);
    return () => window.removeEventListener("branding:updated", handler);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!qrCodeRef.current) return;
    const svg = qrCodeRef.current.querySelector("svg");
    if (!svg) return;

    const primary = branding?.primaryColor || "#000000";
    const hasBanner = !!branding?.bannerUrl;
    const hasLogo = !!branding?.logoUrl;
    const logoPos = branding?.logoPosition ?? "top-left";

    // ── Canvas dimensions ──────────────────────────────────────────────
    const W = 640;
    const PADDING = 48;
    const BANNER_H = hasBanner ? 200 : 0;
    const BANNER_RADIUS = 24;
    const QR_SIZE = 340;
    const QR_FRAME = 28;         // padding inside white QR card
    const LOGO_BADGE = 72;       // logo overlay size (center mode)
    const LOGO_CORNER = 56;      // logo size for corner positions
    const SECTION_GAP = 32;      // vertical gap between major sections
    const H =
      BANNER_H +
      (hasBanner ? 0 : SECTION_GAP) +
      SECTION_GAP +              // top breathing room after banner
      (hasLogo && (logoPos === "top-left" || logoPos === "top-right") ? LOGO_CORNER + 16 : 0) +
      52 +                       // event name
      SECTION_GAP +
      QR_SIZE + QR_FRAME * 2 +   // QR card
      SECTION_GAP +
      (hasLogo && (logoPos === "bottom-left" || logoPos === "bottom-right") ? LOGO_CORNER + 16 : 0) +
      40 +                       // "活动码" label
      56 +                       // slug code
      SECTION_GAP +
      36 +                       // scan instruction
      PADDING;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Card background ────────────────────────────────────────────────
    ctx.fillStyle = "#f8fafc";
    roundRect(ctx, 0, 0, W, H, BANNER_RADIUS);
    ctx.fill();

    // ── Banner ─────────────────────────────────────────────────────────
    if (hasBanner && branding?.bannerUrl) {
      try {
        const bannerImg = await loadImage(branding.bannerUrl);
        ctx.save();
        roundRect(ctx, 0, 0, W, BANNER_H, BANNER_RADIUS);
        ctx.clip();
        // cover-fit the banner
        const bRatio = bannerImg.width / bannerImg.height;
        const cRatio = W / BANNER_H;
        let bx = 0, by = 0, bw = W, bh = BANNER_H;
        if (bRatio > cRatio) {
          bw = BANNER_H * bRatio;
          bx = -(bw - W) / 2;
        } else {
          bh = W / bRatio;
          by = -(bh - BANNER_H) / 2;
        }
        ctx.drawImage(bannerImg, bx, by, bw, bh);
        // subtle darkening overlay at bottom for readability
        const grad = ctx.createLinearGradient(0, BANNER_H * 0.4, 0, BANNER_H);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(0,0,0,0.35)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, BANNER_H);
        ctx.restore();

        // soft bottom fade into card bg
        const fade = ctx.createLinearGradient(0, BANNER_H - 30, 0, BANNER_H + 20);
        fade.addColorStop(0, "rgba(248,250,252,0)");
        fade.addColorStop(1, "rgba(248,250,252,1)");
        ctx.fillStyle = fade;
        ctx.fillRect(0, BANNER_H - 30, W, 50);
      } catch {
        // fallback colored banner
        const grad = ctx.createLinearGradient(0, 0, W, BANNER_H);
        grad.addColorStop(0, primary);
        grad.addColorStop(1, primary + "cc");
        ctx.save();
        roundRect(ctx, 0, 0, W, BANNER_H, BANNER_RADIUS);
        ctx.clip();
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, BANNER_H);
        ctx.restore();
      }
    }

    let cursorY = BANNER_H + SECTION_GAP;
    if (!hasBanner) cursorY += SECTION_GAP;

    // ── Corner logo (top) ─────────────────────────────────────────────
    let topLogoDrawn = false;
    if (hasLogo && branding?.logoUrl && (logoPos === "top-left" || logoPos === "top-right")) {
      try {
        const logoImg = await loadImage(branding.logoUrl);
        const lx = logoPos === "top-left" ? PADDING : W - PADDING - LOGO_CORNER;
        // White pill background
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.10)";
        ctx.shadowBlur = 10;
        roundRect(ctx, lx - 8, cursorY - 8, LOGO_CORNER + 16, LOGO_CORNER + 16, 12);
        ctx.fill();
        ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
        ctx.drawImage(logoImg, lx, cursorY, LOGO_CORNER, LOGO_CORNER);
        cursorY += LOGO_CORNER + 16;
        topLogoDrawn = true;
      } catch { /* skip */ }
    }
    if (!topLogoDrawn && (logoPos === "top-left" || logoPos === "top-right")) {
      cursorY += 0; // no extra gap if logo failed to load
    }

    // ── Event name ─────────────────────────────────────────────────────
    const displayName = eventName.length > 22 ? eventName.slice(0, 19) + "…" : eventName;
    ctx.fillStyle = "#0f172a";
    ctx.font = `bold 38px -apple-system, "PingFang SC", "Helvetica Neue", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(displayName, W / 2, cursorY + 40);
    cursorY += 52 + SECTION_GAP;

    // ── QR code card ───────────────────────────────────────────────────
    const qrCardW = QR_SIZE + QR_FRAME * 2;
    const qrCardH = QR_SIZE + QR_FRAME * 2;
    const qrCardX = (W - qrCardW) / 2;
    const qrCardY = cursorY;

    // Shadow
    ctx.shadowColor = "rgba(0,0,0,0.10)";
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, qrCardX, qrCardY, qrCardW, qrCardH, 20);
    ctx.fill();
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // QR image
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const qrImage = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = svgUrl;
    });
    ctx.drawImage(qrImage, qrCardX + QR_FRAME, qrCardY + QR_FRAME, QR_SIZE, QR_SIZE);
    URL.revokeObjectURL(svgUrl);

    // ── Center logo overlay ────────────────────────────────────────────
    if (hasLogo && branding?.logoUrl && logoPos === "center") {
      try {
        const logoImg = await loadImage(branding.logoUrl);
        const lx = qrCardX + QR_FRAME + (QR_SIZE - LOGO_BADGE) / 2;
        const ly = qrCardY + QR_FRAME + (QR_SIZE - LOGO_BADGE) / 2;
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.12)";
        ctx.shadowBlur = 8;
        roundRect(ctx, lx - 6, ly - 6, LOGO_BADGE + 12, LOGO_BADGE + 12, 10);
        ctx.fill();
        ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
        ctx.drawImage(logoImg, lx, ly, LOGO_BADGE, LOGO_BADGE);
      } catch { /* skip */ }
    }

    cursorY += qrCardH + SECTION_GAP;

    // ── Corner logo (bottom) ───────────────────────────────────────────
    if (hasLogo && branding?.logoUrl && (logoPos === "bottom-left" || logoPos === "bottom-right")) {
      try {
        const logoImg = await loadImage(branding.logoUrl);
        const lx = logoPos === "bottom-left" ? PADDING : W - PADDING - LOGO_CORNER;
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.10)";
        ctx.shadowBlur = 10;
        roundRect(ctx, lx - 8, cursorY - 8, LOGO_CORNER + 16, LOGO_CORNER + 16, 12);
        ctx.fill();
        ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
        ctx.drawImage(logoImg, lx, cursorY, LOGO_CORNER, LOGO_CORNER);
        cursorY += LOGO_CORNER + 16;
      } catch { /* skip */ }
    }

    // ── "活动码 / Event Code" label ────────────────────────────────────
    ctx.fillStyle = "#94a3b8";
    ctx.font = `500 18px -apple-system, "PingFang SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("活动码 / Event Code", W / 2, cursorY + 20);
    cursorY += 40;

    // ── Slug pill ─────────────────────────────────────────────────────
    const slugText = slug.toUpperCase();
    ctx.font = `bold 40px "SF Mono", "Fira Code", monospace`;
    const slugW = ctx.measureText(slugText).width + 48;
    const slugPillX = (W - slugW) / 2;
    ctx.fillStyle = primary + "18";
    roundRect(ctx, slugPillX, cursorY, slugW, 52, 12);
    ctx.fill();
    ctx.fillStyle = primary;
    ctx.fillText(slugText, W / 2, cursorY + 38);
    cursorY += 56 + SECTION_GAP;

    // ── Scan instruction ───────────────────────────────────────────────
    ctx.fillStyle = "#cbd5e1";
    ctx.font = `16px -apple-system, "PingFang SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("扫描二维码参与活动 · Scan to join", W / 2, cursorY + 16);
    cursorY += 36;

    // ── LiveDrop watermark ─────────────────────────────────────────────
    ctx.fillStyle = "#e2e8f0";
    ctx.font = `12px -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Powered by LiveDrop", W / 2, cursorY + PADDING / 2);

    // ── Download ───────────────────────────────────────────────────────
    const link = document.createElement("a");
    link.download = `event-qr-${slug}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  }, [eventName, slug, branding]);

  return (
    <>
      {/* Hidden QR code for rendering */}
      <div ref={qrCodeRef} className="hidden">
        <QRCode
          value={url}
          size={340}
          level="H"
          fgColor={branding?.primaryColor || "#000000"}
          bgColor="#ffffff"
        />
      </div>
      <Button variant="outline" size="icon" onClick={handleDownload} title="下载活动二维码">
        <Download className="h-4 w-4" />
      </Button>
    </>
  );
}
