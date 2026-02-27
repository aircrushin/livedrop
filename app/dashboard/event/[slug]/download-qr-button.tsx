"use client";

import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import QRCode from "react-qr-code";
import { cn } from "@/lib/utils";

interface BrandingConfig {
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string;
  backgroundColor?: string;
}

interface DownloadQRButtonProps {
  url: string;
  eventName: string;
  slug: string;
  branding?: BrandingConfig;
}

export function DownloadQRButton({ url, eventName, slug, branding }: DownloadQRButtonProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    if (!qrCodeRef.current) return;

    const svg = qrCodeRef.current.querySelector("svg");
    if (!svg) return;

    // Load images if branding is provided
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    // Convert SVG to PNG
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const qrImage = new Image();
    
    qrImage.onload = async () => {
      // Card dimensions
      const cardWidth = 600;
      const cardHeight = 800;
      const hasBanner = !!branding?.bannerUrl;
      const bannerHeight = hasBanner ? 120 : 0;
      
      // Create main canvas
      const canvas = document.createElement("canvas");
      canvas.width = cardWidth;
      canvas.height = cardHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const bgColor = branding?.backgroundColor || "#0f172a";
      const primaryColor = branding?.primaryColor || "#3b82f6";

      // Fill card background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, cardWidth, cardHeight);

      // Draw banner if provided
      if (hasBanner && branding?.bannerUrl) {
        try {
          const bannerImg = await loadImage(branding.bannerUrl);
          ctx.drawImage(bannerImg, 0, 0, cardWidth, bannerHeight);
          
          // Add gradient overlay for better text readability
          const gradient = ctx.createLinearGradient(0, 0, 0, bannerHeight);
          gradient.addColorStop(0, "rgba(0,0,0,0.3)");
          gradient.addColorStop(1, "rgba(0,0,0,0.1)");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, cardWidth, bannerHeight);
        } catch {
          // Fallback: draw a colored banner area
          ctx.fillStyle = primaryColor;
          ctx.fillRect(0, 0, cardWidth, bannerHeight);
        }
      }

      // Add subtle border
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.strokeRect(12, 12, cardWidth - 24, cardHeight - 24);

      // Draw decorative top bar
      const topBarGradient = ctx.createLinearGradient(0, 0, cardWidth, 0);
      topBarGradient.addColorStop(0, "#1a1a2e");
      topBarGradient.addColorStop(0.3, "#16213e");
      topBarGradient.addColorStop(0.7, "#0f3460");
      topBarGradient.addColorStop(1, "#1a1a2e");
      ctx.fillStyle = topBarGradient;
      ctx.fillRect(0, bannerHeight, cardWidth, 6);
      
      // Add subtle glowing edge effect on top bar
      ctx.shadowColor = "rgba(15, 52, 96, 0.5)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      ctx.fillRect(0, bannerHeight, cardWidth, 6);
      ctx.shadowColor = "transparent";

      // Title text - Event Name
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "bold 42px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      
      // Truncate event name if too long
      let displayName = eventName;
      if (displayName.length > 20) {
        displayName = displayName.substring(0, 17) + "...";
      }
      
      const titleY = hasBanner ? bannerHeight + 80 : 100;
      
      // Draw event name with glow effect
      ctx.shadowColor = "rgba(99, 102, 241, 0.3)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillText(displayName, cardWidth / 2, titleY);
      
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw QR code container
      const qrSize = 380;
      const qrX = (cardWidth - qrSize) / 2;
      const qrY = hasBanner ? bannerHeight + 140 : 150;
      
      // QR code background
      ctx.fillStyle = branding?.backgroundColor || "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 16);
      ctx.fill();
      
      // QR code shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10;
      ctx.fill();
      ctx.shadowColor = "transparent";

      // Draw QR code
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      // Draw logo in center of QR code if provided
      if (branding?.logoUrl) {
        try {
          const logoImg = await loadImage(branding.logoUrl);
          const logoSize = 80;
          const logoX = qrX + (qrSize - logoSize) / 2;
          const logoY = qrY + (qrSize - logoSize) / 2;
          
          // Logo background
          ctx.fillStyle = branding?.backgroundColor || "#ffffff";
          ctx.beginPath();
          ctx.roundRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10, 8);
          ctx.fill();
          
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        } catch {
          // Logo failed to load, skip it
        }
      }

      // Event code label
      const infoY = qrY + qrSize + 60;
      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 20px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("活动码 / Event Code", cardWidth / 2, infoY);

      // Event code value
      ctx.fillStyle = primaryColor;
      ctx.font = "bold 48px monospace";
      ctx.textAlign = "center";
      ctx.fillText(slug.toUpperCase(), cardWidth / 2, infoY + 60);

      // Bottom instruction
      ctx.fillStyle = "#64748b";
      ctx.font = "18px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("扫描二维码参与活动 / Scan to join", cardWidth / 2, cardHeight - 60);

      // Draw logo/branding area
      ctx.fillStyle = "#475569";
      ctx.font = "16px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("LiveDrop", cardWidth / 2, cardHeight - 25);

      // Cleanup and download
      URL.revokeObjectURL(svgUrl);
      
      const link = document.createElement("a");
      link.download = `event-qr-${slug}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    };

    qrImage.src = svgUrl;
  }, [eventName, slug, branding]);

  return (
    <>
      {/* Hidden QR code for rendering */}
      <div ref={qrCodeRef} className="hidden">
        <QRCode 
          value={url} 
          size={380} 
          level="H" 
          fgColor={branding?.primaryColor || "#000000"}
          bgColor={branding?.backgroundColor || "#ffffff"}
        />
      </div>
      <Button variant="outline" size="icon" onClick={handleDownload} title="下载活动二维码">
        <Download className="h-4 w-4" />
      </Button>
    </>
  );
}
