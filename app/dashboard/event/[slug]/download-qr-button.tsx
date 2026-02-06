"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DownloadQRButtonProps {
  url: string;
}

export function DownloadQRButton({ url }: DownloadQRButtonProps) {
  const handleDownload = useCallback(() => {
    const svg = document.querySelector(".qr-code-container svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = "qrcode.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  return (
    <Button variant="outline" size="icon" onClick={handleDownload} title="Download QR Code">
      <Download className="h-4 w-4" />
    </Button>
  );
}
