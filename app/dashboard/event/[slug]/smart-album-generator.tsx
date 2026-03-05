"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Download,
  ImageIcon,
  LayoutGrid,
  Sparkles,
  Check,
  Palette,
} from "lucide-react";
import { getR2PublicUrl } from "@/lib/r2/utils";
import type { Photo } from "@/lib/supabase/types";

interface SmartAlbumGeneratorProps {
  photos: Photo[];
  eventName: string;
  isOpen: boolean;
  onClose: () => void;
}

type AlbumLayout = "grid" | "masonry" | "polaroid" | "filmstrip";
type AlbumTheme = "light" | "dark" | "warm" | "cool";

interface AlbumConfig {
  layout: AlbumLayout;
  theme: AlbumTheme;
  photosPerPage: number;
  includeTimestamp: boolean;
  includeEventName: boolean;
}

function getLayoutPhotoLimit(layout: AlbumLayout): number {
  switch (layout) {
    case "polaroid":
      return 5;
    case "filmstrip":
      return 6;
    case "grid":
    case "masonry":
    default:
      return 9;
  }
}

function getRandomPhotos(photos: Photo[], count: number): Photo[] {
  const shuffled = [...photos];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

const THEMES: Record<AlbumTheme, { bg: string; text: string; accent: string; border: string }> = {
  light: { bg: "#ffffff", text: "#1f2937", accent: "#000000", border: "#e5e7eb" },
  dark: { bg: "#1f2937", text: "#f9fafb", accent: "#60a5fa", border: "#374151" },
  warm: { bg: "#fff7ed", text: "#7c2d12", accent: "#ea580c", border: "#fed7aa" },
  cool: { bg: "#f0f9ff", text: "#0c4a6e", accent: "#0284c7", border: "#bae6fd" },
};

const LAYOUTS: { id: AlbumLayout; name: string; icon: typeof LayoutGrid }[] = [
  { id: "grid", name: "gridLayout", icon: LayoutGrid },
  { id: "masonry", name: "masonryLayout", icon: ImageIcon },
  { id: "polaroid", name: "polaroidLayout", icon: Sparkles },
  { id: "filmstrip", name: "filmstripLayout", icon: ImageIcon },
];

// Helper function to draw rounded rectangle
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function SmartAlbumGenerator({
  photos,
  eventName,
  isOpen,
  onClose,
}: SmartAlbumGeneratorProps) {
  const t = useTranslations("smartAlbum");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [config, setConfig] = useState<AlbumConfig>({
    layout: "grid",
    theme: "light",
    photosPerPage: 9,
    includeTimestamp: true,
    includeEventName: true,
  });

  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const generateGridLayout = useCallback(
    async (
      ctx: CanvasRenderingContext2D,
      images: HTMLImageElement[],
      canvasWidth: number,
      canvasHeight: number,
      theme: AlbumTheme
    ) => {
      const themeColors = THEMES[theme];
      const cols = 3;
      const rows = 3;
      const padding = 40;
      const gap = 20;
      const availableWidth = canvasWidth - padding * 2;
      const availableHeight = canvasHeight - padding * 2 - 100;
      const cellWidth = (availableWidth - gap * (cols - 1)) / cols;
      const cellHeight = (availableHeight - gap * (rows - 1)) / rows;

      // Background
      ctx.fillStyle = themeColors.bg;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw images
      for (let i = 0; i < Math.min(images.length, 9); i++) {
        const img = images[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = padding + col * (cellWidth + gap);
        const y = padding + row * (cellHeight + gap);

        // Calculate aspect ratio preserving dimensions
        const imgAspect = img.width / img.height;
        const cellAspect = cellWidth / cellHeight;

        let drawWidth, drawHeight, drawX, drawY;
        if (imgAspect > cellAspect) {
          drawWidth = cellWidth;
          drawHeight = cellWidth / imgAspect;
          drawX = x;
          drawY = y + (cellHeight - drawHeight) / 2;
        } else {
          drawWidth = cellHeight * imgAspect;
          drawHeight = cellHeight;
          drawX = x + (cellWidth - drawWidth) / 2;
          drawY = y;
        }

        // Draw rounded image
        ctx.save();
        drawRoundedRect(ctx, drawX, drawY, drawWidth, drawHeight, 12);
        ctx.clip();
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();

        // Draw border
        ctx.strokeStyle = themeColors.border;
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, drawX, drawY, drawWidth, drawHeight, 12);
        ctx.stroke();
      }

      // Event name
      if (config.includeEventName) {
        ctx.fillStyle = themeColors.text;
        ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(eventName, canvasWidth / 2, canvasHeight - 50);
      }
    },
    [config.includeEventName, eventName]
  );

  const generateMasonryLayout = useCallback(
    async (
      ctx: CanvasRenderingContext2D,
      images: HTMLImageElement[],
      canvasWidth: number,
      canvasHeight: number,
      theme: AlbumTheme
    ) => {
      const themeColors = THEMES[theme];
      const cols = 3;
      const padding = 40;
      const gap = 16;
      const availableWidth = canvasWidth - padding * 2;
      const cellWidth = (availableWidth - gap * (cols - 1)) / cols;
      const colHeights: number[] = [0, 0, 0];

      // Background
      ctx.fillStyle = themeColors.bg;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw images
      for (let i = 0; i < Math.min(images.length, 9); i++) {
        const img = images[i];
        const col = colHeights.indexOf(Math.min(...colHeights));
        const x = padding + col * (cellWidth + gap);
        const y = padding + colHeights[col];

        const imgAspect = img.width / img.height;
        const drawWidth = cellWidth;
        const drawHeight = cellWidth / imgAspect;

        // Draw rounded image
        ctx.save();
        drawRoundedRect(ctx, x, y, drawWidth, drawHeight, 12);
        ctx.clip();
        ctx.drawImage(img, x, y, drawWidth, drawHeight);
        ctx.restore();

        colHeights[col] += drawHeight + gap;
      }

      // Event name
      if (config.includeEventName) {
        ctx.fillStyle = themeColors.text;
        ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(eventName, canvasWidth / 2, canvasHeight - 30);
      }
    },
    [config.includeEventName, eventName]
  );

  const generatePolaroidLayout = useCallback(
    async (
      ctx: CanvasRenderingContext2D,
      images: HTMLImageElement[],
      canvasWidth: number,
      canvasHeight: number,
      theme: AlbumTheme
    ) => {
      const themeColors = THEMES[theme];
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;

      // Background
      ctx.fillStyle = themeColors.bg;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw polaroid-style photos scattered
      const positions = [
        { x: centerX - 200, y: centerY - 150, rotation: -15 },
        { x: centerX + 50, y: centerY - 180, rotation: 10 },
        { x: centerX - 100, y: centerY + 50, rotation: 5 },
        { x: centerX + 150, y: centerY + 80, rotation: -8 },
        { x: centerX - 250, y: centerY + 100, rotation: 12 },
      ];

      for (let i = 0; i < Math.min(images.length, 5); i++) {
        const img = images[i];
        const pos = positions[i];
        const polaroidWidth = 200;
        const polaroidHeight = 240;
        const photoPadding = 15;
        const photoWidth = polaroidWidth - photoPadding * 2;
        const photoHeight = polaroidHeight - photoPadding * 2 - 40;

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate((pos.rotation * Math.PI) / 180);

        // Polaroid background with shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = "#ffffff";
        drawRoundedRect(ctx, 0, 0, polaroidWidth, polaroidHeight, 8);
        ctx.fill();
        ctx.shadowColor = "transparent";

        // Photo
        const imgAspect = img.width / img.height;
        const photoAspect = photoWidth / photoHeight;
        let drawWidth, drawHeight, drawX, drawY;

        if (imgAspect > photoAspect) {
          drawHeight = photoHeight;
          drawWidth = photoHeight * imgAspect;
          drawX = photoPadding + (photoWidth - drawWidth) / 2;
          drawY = photoPadding;
        } else {
          drawWidth = photoWidth;
          drawHeight = photoWidth / imgAspect;
          drawX = photoPadding;
          drawY = photoPadding + (photoHeight - drawHeight) / 2;
        }

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        ctx.restore();
      }

      // Event name
      if (config.includeEventName) {
        ctx.fillStyle = themeColors.text;
        ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(eventName, centerX, canvasHeight - 60);
      }
    },
    [config.includeEventName, eventName]
  );

  const generateFilmstripLayout = useCallback(
    async (
      ctx: CanvasRenderingContext2D,
      images: HTMLImageElement[],
      canvasWidth: number,
      canvasHeight: number,
      theme: AlbumTheme
    ) => {
      const themeColors = THEMES[theme];
      const stripHeight = 200;
      const padding = 40;
      const perforationSize = 12;

      // Background
      ctx.fillStyle = themeColors.bg;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw film strips
      const stripY1 = padding + 100;
      const stripY2 = stripY1 + stripHeight + 100;

      [stripY1, stripY2].forEach((stripY) => {
        // Film strip background
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(padding, stripY, canvasWidth - padding * 2, stripHeight);

        // Perforations
        ctx.fillStyle = "#333333";
        for (let x = padding + 10; x < canvasWidth - padding; x += 30) {
          ctx.fillRect(x, stripY + 10, perforationSize, perforationSize);
          ctx.fillRect(x, stripY + stripHeight - 20, perforationSize, perforationSize);
        }
      });

      // Draw images in film strip frames
      const frameWidth = 160;
      const frameX = padding + 40;

      for (let i = 0; i < Math.min(images.length, 6); i++) {
        const img = images[i];
        const stripIndex = Math.floor(i / 3);
        const frameIndex = i % 3;
        const x = frameX + frameIndex * (frameWidth + 20);
        const y = (stripIndex === 0 ? stripY1 : stripY2) + 30;
        const frameHeight = 140;

        // Draw image with cover fit
        const imgAspect = img.width / img.height;
        const frameAspect = frameWidth / frameHeight;

        let drawWidth, drawHeight, drawX, drawY;
        if (imgAspect > frameAspect) {
          drawHeight = frameHeight;
          drawWidth = frameHeight * imgAspect;
          drawX = x + (frameWidth - drawWidth) / 2;
          drawY = y;
        } else {
          drawWidth = frameWidth;
          drawHeight = frameWidth / imgAspect;
          drawX = x;
          drawY = y + (frameHeight - drawHeight) / 2;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, frameWidth, frameHeight);
        ctx.clip();
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      }

      // Event name
      if (config.includeEventName) {
        ctx.fillStyle = themeColors.text;
        ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(eventName, canvasWidth / 2, canvasHeight - 40);
      }
    },
    [config.includeEventName, eventName]
  );

  const generateAlbum = useCallback(async () => {
    if (photos.length === 0) return;

    setIsGenerating(true);
    setProgress(0);
    setPreviewUrl(null);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size (1200x1600 for portrait album)
      canvas.width = 1200;
      canvas.height = 1600;

      // Load images
      const visiblePhotos = photos.filter((p) => p.is_visible);
      if (visiblePhotos.length === 0) {
        setIsGenerating(false);
        return;
      }

      const photoLimit = Math.min(getLayoutPhotoLimit(config.layout), visiblePhotos.length);
      const selectedPhotos = getRandomPhotos(visiblePhotos, photoLimit);

      const images: HTMLImageElement[] = [];
      for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        const url = getR2PublicUrl(photo.storage_path);
        try {
          const img = await loadImage(url);
          images.push(img);
        } catch {
          // Skip failed images
        }
        setProgress(Math.round(((i + 1) / selectedPhotos.length) * 30));
      }

      setProgress(40);

      // Generate based on layout
      switch (config.layout) {
        case "grid":
          await generateGridLayout(ctx, images, canvas.width, canvas.height, config.theme);
          break;
        case "masonry":
          await generateMasonryLayout(ctx, images, canvas.width, canvas.height, config.theme);
          break;
        case "polaroid":
          await generatePolaroidLayout(ctx, images, canvas.width, canvas.height, config.theme);
          break;
        case "filmstrip":
          await generateFilmstripLayout(ctx, images, canvas.width, canvas.height, config.theme);
          break;
      }

      setProgress(100);

      // Generate preview
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setPreviewUrl(dataUrl);
    } finally {
      setIsGenerating(false);
    }
  }, [
    photos,
    config,
    loadImage,
    generateGridLayout,
    generateMasonryLayout,
    generatePolaroidLayout,
    generateFilmstripLayout,
  ]);

  const downloadAlbum = useCallback(() => {
    if (!previewUrl) return;

    const link = document.createElement("a");
    link.download = `${eventName.replace(/\s+/g, "_")}_album.jpg`;
    link.href = previewUrl;
    link.click();
  }, [previewUrl, eventName]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuration */}
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Layout Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  {t("selectLayout")}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {LAYOUTS.map((layout) => {
                    const Icon = layout.icon;
                    return (
                      <button
                        key={layout.id}
                        onClick={() => setConfig((c) => ({ ...c, layout: layout.id }))}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                          config.layout === layout.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{t(layout.name)}</span>
                        {config.layout === layout.id && (
                          <Check className="h-3 w-3 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Theme Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  {t("selectTheme")}
                </label>
                <div className="flex gap-2">
                  {(Object.keys(THEMES) as AlbumTheme[]).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setConfig((c) => ({ ...c, theme }))}
                      className={`flex-1 p-3 rounded-lg border transition-all ${
                        config.theme === theme
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-border hover:border-primary/50"
                      }`}
                      style={{
                        backgroundColor: THEMES[theme].bg,
                      }}
                    >
                      <span
                        className="text-sm font-medium"
                        style={{ color: THEMES[theme].text }}
                      >
                        {t(`theme${theme.charAt(0).toUpperCase() + theme.slice(1)}`)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeEventName}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, includeEventName: e.target.checked }))
                    }
                    className="rounded border-border"
                  />
                  <span className="text-sm">{t("includeEventName")}</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Preview Canvas */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Preview Display */}
          {previewUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("preview")}</label>
              <div className="relative aspect-[3/4] max-h-[500px] rounded-lg overflow-hidden border border-border bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Album preview"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("generating")} ({progress}%)
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={generateAlbum}
              disabled={isGenerating || photos.filter((p) => p.is_visible).length === 0}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("generating")}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {previewUrl ? t("regenerate") : t("generate")}
                </>
              )}
            </Button>
            {previewUrl && (
              <Button onClick={downloadAlbum} variant="secondary" className="gap-2">
                <Download className="h-4 w-4" />
                {t("download")}
              </Button>
            )}
          </div>

          {photos.filter((p) => p.is_visible).length === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              {t("noVisiblePhotos")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
