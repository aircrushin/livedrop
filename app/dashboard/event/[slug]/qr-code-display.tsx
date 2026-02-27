"use client";

import QRCode from "react-qr-code";
import { cn } from "@/lib/utils";

interface QRCodeDisplayProps {
  url: string;
  logoUrl?: string | null;
  logoPosition?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  primaryColor?: string;
  backgroundColor?: string;
}

export function QRCodeDisplay({ 
  url, 
  logoUrl, 
  logoPosition = "center",
  primaryColor,
  backgroundColor 
}: QRCodeDisplayProps) {
  const hasLogo = !!logoUrl;

  return (
    <div 
      className={cn(
        "qr-code-container p-4 rounded-lg flex flex-col items-center justify-center relative",
        !backgroundColor && "bg-white"
      )}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      {/* Banner */}
      {hasLogo && logoPosition !== "center" && (
        <div className="w-full mb-3">
          <img 
            src={logoUrl} 
            alt="Brand Logo" 
            className={cn(
              "h-8 object-contain",
              logoPosition.includes("left") && "mr-auto",
              logoPosition.includes("right") && "ml-auto",
              logoPosition.includes("center") && "mx-auto"
            )}
          />
        </div>
      )}

      {/* QR Code with Logo Overlay */}
      <div className="relative">
        <QRCode
          value={url}
          size={200}
          level="H"
          fgColor={primaryColor || "#000000"}
          bgColor={backgroundColor || "#ffffff"}
        />
        
        {/* Center Logo Overlay */}
        {hasLogo && logoPosition === "center" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="bg-white rounded-lg p-1 shadow-lg"
              style={{ backgroundColor: backgroundColor || "#ffffff" }}
            >
              <img 
                src={logoUrl} 
                alt="Brand Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
