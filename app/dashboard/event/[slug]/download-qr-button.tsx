"use client";

import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import QRCode from "react-qr-code";

interface DownloadQRButtonProps {
  url: string;
  eventName: string;
  slug: string;
}

export function DownloadQRButton({ url, eventName, slug }: DownloadQRButtonProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    if (!qrCodeRef.current) return;

    const svg = qrCodeRef.current.querySelector("svg");
    if (!svg) return;

    // Convert SVG to PNG
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const qrImage = new Image();
    
    qrImage.onload = () => {
      // Card dimensions
      const cardWidth = 600;
      const cardHeight = 800;
      
      // Create main canvas
      const canvas = document.createElement("canvas");
      canvas.width = cardWidth;
      canvas.height = cardHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fill card background with dark gradient
      const gradient = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
      gradient.addColorStop(0, "#0f172a");
      gradient.addColorStop(0.5, "#1e293b");
      gradient.addColorStop(1, "#0f172a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, cardWidth, cardHeight);

      // Add subtle border
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.strokeRect(12, 12, cardWidth - 24, cardHeight - 24);

      // Draw decorative top bar - dark cyberpunk theme
      const topBarGradient = ctx.createLinearGradient(0, 0, cardWidth, 0);
      topBarGradient.addColorStop(0, "#1a1a2e");
      topBarGradient.addColorStop(0.3, "#16213e");
      topBarGradient.addColorStop(0.7, "#0f3460");
      topBarGradient.addColorStop(1, "#1a1a2e");
      ctx.fillStyle = topBarGradient;
      ctx.fillRect(0, 0, cardWidth, 6);
      
      // Add subtle glowing edge effect on top bar
      ctx.shadowColor = "rgba(15, 52, 96, 0.5)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      ctx.fillRect(0, 0, cardWidth, 6);
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
      
      // Draw event name with glow effect for dark theme
      ctx.shadowColor = "rgba(99, 102, 241, 0.3)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillText(displayName, cardWidth / 2, 100);
      
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw QR code container
      const qrSize = 380;
      const qrX = (cardWidth - qrSize) / 2;
      const qrY = 150;
      
      // QR code background
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 16);
      ctx.fill();
      
      // QR code shadow - adjusted for dark theme
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10;
      ctx.fill();
      ctx.shadowColor = "transparent";

      // Draw QR code
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      // Event code label
      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 20px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("活动码 / Event Code", cardWidth / 2, 600);

      // Event code value
      ctx.fillStyle = "#818cf8";
      ctx.font = "bold 48px monospace";
      ctx.textAlign = "center";
      ctx.fillText(slug.toUpperCase(), cardWidth / 2, 660);

      // Bottom instruction
      ctx.fillStyle = "#64748b";
      ctx.font = "18px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("扫描二维码参与活动 / Scan to join", cardWidth / 2, 740);

      // Draw logo/branding area
      ctx.fillStyle = "#475569";
      ctx.font = "16px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("LiveDrop", cardWidth / 2, 775);

      // Cleanup and download
      URL.revokeObjectURL(svgUrl);
      
      const link = document.createElement("a");
      link.download = `event-qr-${slug}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    };

    qrImage.src = svgUrl;
  }, [eventName, slug]);

  return (
    <>
      {/* Hidden QR code for rendering */}
      <div ref={qrCodeRef} className="hidden">
        <QRCode value={url} size={380} level="H" />
      </div>
      <Button variant="outline" size="icon" onClick={handleDownload} title="下载活动二维码">
        <Download className="h-4 w-4" />
      </Button>
    </>
  );
}
