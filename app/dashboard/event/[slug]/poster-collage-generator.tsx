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
  LayoutTemplate,
  Grid3X3,
  Diamond,
  Layers,
  Check,
  Type,
  Palette,
  Sparkles,
} from "lucide-react";
import { getR2PublicUrl } from "@/lib/r2/utils";
import type { Photo } from "@/lib/supabase/types";

interface PosterCollageGeneratorProps {
  photos: Photo[];
  eventName: string;
  isOpen: boolean;
  onClose: () => void;
}

type PosterLayout = "classic" | "hero" | "collage" | "mosaic" | "polaroid-wall";
type PosterTheme = "modern" | "vintage" | "minimal" | "colorful";
type PosterRatio = "instagram" | "story" | "poster" | "wide";

interface PosterConfig {
  layout: PosterLayout;
  theme: PosterTheme;
  ratio: PosterRatio;
  includeTitle: boolean;
  includeDate: boolean;
  title: string;
}

const RATIOS: Record<PosterRatio, { width: number; height: number; label: string }> = {
  instagram: { width: 1080, height: 1080, label: "1:1 Instagram" },
  story: { width: 1080, height: 1920, label: "9:16 Story" },
  poster: { width: 1200, height: 1600, label: "3:4 Poster" },
  wide: { width: 1920, height: 1080, label: "16:9 Wide" },
};

const THEMES: Record<PosterTheme, { 
  bg: string; 
  text: string; 
  accent: string; 
  overlay: string;
  gradient: string[];
}> = {
  modern: { 
    bg: "#0f172a", 
    text: "#ffffff", 
    accent: "#000000", 
    overlay: "rgba(0,0,0,0.3)",
    gradient: ["#1e293b", "#0f172a"]
  },
  vintage: { 
    bg: "#fef3c7", 
    text: "#78350f", 
    accent: "#d97706", 
    overlay: "rgba(120,53,15,0.2)",
    gradient: ["#fef3c7", "#fde68a"]
  },
  minimal: { 
    bg: "#ffffff", 
    text: "#171717", 
    accent: "#525252", 
    overlay: "rgba(0,0,0,0.1)",
    gradient: ["#ffffff", "#f5f5f5"]
  },
  colorful: { 
    bg: "#4c1d95", 
    text: "#ffffff", 
    accent: "#f472b6", 
    overlay: "rgba(0,0,0,0.2)",
    gradient: ["#7c3aed", "#db2777"]
  },
};

const LAYOUTS: { id: PosterLayout; name: string; icon: typeof LayoutTemplate }[] = [
  { id: "classic", name: "classicLayout", icon: Grid3X3 },
  { id: "hero", name: "heroLayout", icon: LayoutTemplate },
  { id: "collage", name: "collageLayout", icon: Layers },
  { id: "mosaic", name: "mosaicLayout", icon: Diamond },
  { id: "polaroid-wall", name: "polaroidLayout", icon: Sparkles },
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

// Helper function to draw gradient background
function drawGradient(
  ctx: CanvasRenderingContext2D,
  colors: string[],
  width: number,
  height: number
) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export function PosterCollageGenerator({
  photos,
  eventName,
  isOpen,
  onClose,
}: PosterCollageGeneratorProps) {
  const t = useTranslations("posterCollage");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [config, setConfig] = useState<PosterConfig>({
    layout: "classic",
    theme: "modern",
    ratio: "poster",
    includeTitle: true,
    includeDate: true,
    title: eventName,
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

  const drawCoverImage = useCallback((
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    radius = 0
  ) => {
    const imgAspect = img.width / img.height;
    const targetAspect = width / height;

    let drawWidth, drawHeight, drawX, drawY;

    if (imgAspect > targetAspect) {
      drawHeight = height;
      drawWidth = height * imgAspect;
      drawX = x + (width - drawWidth) / 2;
      drawY = y;
    } else {
      drawWidth = width;
      drawHeight = width / imgAspect;
      drawX = x;
      drawY = y + (height - drawHeight) / 2;
    }

    if (radius > 0) {
      ctx.save();
      drawRoundedRect(ctx, x, y, width, height, radius);
      ctx.clip();
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();
    } else {
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }
  }, []);

  const generateClassicLayout = useCallback(async (
    ctx: CanvasRenderingContext2D,
    images: HTMLImageElement[],
    width: number,
    height: number,
    theme: PosterTheme
  ) => {
    const themeColors = THEMES[theme];
    const padding = Math.min(width, height) * 0.05;
    const gap = padding * 0.5;
    
    // Background
    drawGradient(ctx, themeColors.gradient, width, height);

    // Calculate grid
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2 - (config.includeTitle ? 120 : 0);
    const cols = Math.min(3, images.length);
    const rows = Math.ceil(images.length / cols);
    const cellWidth = (availableWidth - gap * (cols - 1)) / cols;
    const cellHeight = (availableHeight - gap * (rows - 1)) / rows;

    // Draw images
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = padding + col * (cellWidth + gap);
      const y = padding + row * (cellHeight + gap);

      const radius = Math.min(cellWidth, cellHeight) * 0.03;
      drawCoverImage(ctx, img, x, y, cellWidth, cellHeight, radius);
    }

    // Title
    if (config.includeTitle) {
      ctx.fillStyle = themeColors.text;
      ctx.font = `bold ${Math.min(width * 0.05, 48)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.title, width / 2, height - padding - 40);

      if (config.includeDate) {
        ctx.font = `${Math.min(width * 0.025, 24)}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = themeColors.accent;
        const date = new Date().toLocaleDateString();
        ctx.fillText(date, width / 2, height - padding - 10);
      }
    }
  }, [config.includeTitle, config.includeDate, config.title, drawCoverImage]);

  const generateHeroLayout = useCallback(async (
    ctx: CanvasRenderingContext2D,
    images: HTMLImageElement[],
    width: number,
    height: number,
    theme: PosterTheme
  ) => {
    const themeColors = THEMES[theme];
    const padding = Math.min(width, height) * 0.05;
    
    // Background
    drawGradient(ctx, themeColors.gradient, width, height);

    if (images.length === 0) return;

    // Hero image takes 60% of height
    const heroHeight = height * 0.6;
    const gap = padding * 0.5;
    
    // Draw hero image
    drawCoverImage(ctx, images[0], padding, padding, width - padding * 2, heroHeight, 20);

    // Draw remaining images in a row
    const remainingImages = images.slice(1, 4);
    if (remainingImages.length > 0) {
      const thumbY = heroHeight + padding + gap;
      const thumbHeight = height - thumbY - padding - (config.includeTitle ? 100 : 0);
      const thumbWidth = (width - padding * 2 - gap * (remainingImages.length - 1)) / remainingImages.length;

      remainingImages.forEach((img, index) => {
        const x = padding + index * (thumbWidth + gap);
        drawCoverImage(ctx, img, x, thumbY, thumbWidth, thumbHeight, 12);
      });
    }

    // Title overlay on hero
    if (config.includeTitle) {
      const gradientOverlay = ctx.createLinearGradient(0, heroHeight - 150, 0, heroHeight);
      gradientOverlay.addColorStop(0, "transparent");
      gradientOverlay.addColorStop(1, "rgba(0,0,0,0.7)");
      ctx.fillStyle = gradientOverlay;
      ctx.fillRect(padding, heroHeight - 150 + padding, width - padding * 2, 150);

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.min(width * 0.06, 56)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(config.title, padding * 2, heroHeight + padding - 30);

      if (config.includeDate) {
        ctx.font = `${Math.min(width * 0.03, 28)}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = themeColors.accent;
        const date = new Date().toLocaleDateString();
        ctx.fillText(date, padding * 2, heroHeight + padding - 5);
      }
    }
  }, [config.includeTitle, config.includeDate, config.title, drawCoverImage]);

  const generateCollageLayout = useCallback(async (
    ctx: CanvasRenderingContext2D,
    images: HTMLImageElement[],
    width: number,
    height: number,
    theme: PosterTheme
  ) => {
    const themeColors = THEMES[theme];
    
    // Background
    drawGradient(ctx, themeColors.gradient, width, height);

    if (images.length < 2) return;

    const padding = Math.min(width, height) * 0.04;
    const gap = padding * 0.5;

    // Asymmetric collage layout
    const layouts: Array<{ x: number; y: number; w: number; h: number }> = [
      { x: padding, y: padding, w: width * 0.55 - padding - gap/2, h: height * 0.6 },
      { x: width * 0.55 + gap/2, y: padding, w: width * 0.45 - padding - gap/2, h: height * 0.35 },
      { x: width * 0.55 + gap/2, y: padding + height * 0.35 + gap, w: width * 0.45 - padding - gap/2, h: height * 0.25 - gap },
      { x: padding, y: padding + height * 0.6 + gap, w: width * 0.4 - padding - gap/2, h: height * 0.35 - padding - gap },
      { x: width * 0.4 + gap/2, y: padding + height * 0.6 + gap, w: width * 0.6 - padding - gap/2, h: height * 0.35 - padding - gap },
    ];

    for (let i = 0; i < Math.min(images.length, layouts.length); i++) {
      const layout = layouts[i];
      const radius = Math.min(layout.w, layout.h) * 0.04;
      drawCoverImage(ctx, images[i], layout.x, layout.y, layout.w, layout.h, radius);
    }

    // Title
    if (config.includeTitle) {
      ctx.fillStyle = themeColors.text;
      ctx.font = `bold ${Math.min(width * 0.04, 40)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(config.title, width / 2, height - 20);
    }
  }, [config.includeTitle, config.title, drawCoverImage]);

  const generateMosaicLayout = useCallback(async (
    ctx: CanvasRenderingContext2D,
    images: HTMLImageElement[],
    width: number,
    height: number,
    theme: PosterTheme
  ) => {
    const themeColors = THEMES[theme];
    
    // Background
    drawGradient(ctx, themeColors.gradient, width, height);

    const padding = Math.min(width, height) * 0.03;
    const gap = padding * 0.5;

    // Hexagon-like staggered grid
    const cols = 4;
    const cellWidth = (width - padding * 2 - gap * (cols - 1)) / cols;
    const cellHeight = cellWidth * 1.2;

    let imageIndex = 0;
    const maxRows = Math.ceil(images.length / cols) + 1;

    for (let row = 0; row < maxRows && imageIndex < images.length; row++) {
      const isOffset = row % 2 === 1;
      const rowCols = isOffset ? cols - 1 : cols;
      const offsetX = isOffset ? cellWidth / 2 + gap / 2 : 0;

      for (let col = 0; col < rowCols && imageIndex < images.length; col++) {
        const x = padding + offsetX + col * (cellWidth + gap);
        const y = padding + row * (cellHeight * 0.75 + gap);
        
        // Diamond shape by using larger radius
        const radius = cellWidth * 0.3;
        drawCoverImage(ctx, images[imageIndex], x, y, cellWidth, cellHeight, radius);
        imageIndex++;
      }
    }

    // Title overlay
    if (config.includeTitle) {
      const titleBg = ctx.createLinearGradient(0, 0, width, 0);
      titleBg.addColorStop(0, "transparent");
      titleBg.addColorStop(0.2, `${themeColors.bg}dd`);
      titleBg.addColorStop(0.8, `${themeColors.bg}dd`);
      titleBg.addColorStop(1, "transparent");
      
      ctx.fillStyle = titleBg;
      ctx.fillRect(0, height / 2 - 40, width, 80);

      ctx.fillStyle = themeColors.text;
      ctx.font = `bold ${Math.min(width * 0.06, 60)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.title, width / 2, height / 2);
    }
  }, [config.includeTitle, config.title, drawCoverImage]);

  const generatePolaroidWallLayout = useCallback(async (
    ctx: CanvasRenderingContext2D,
    images: HTMLImageElement[],
    width: number,
    height: number,
    theme: PosterTheme
  ) => {
    const themeColors = THEMES[theme];
    
    // Background
    drawGradient(ctx, themeColors.gradient, width, height);

    // Add subtle texture
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3;
      ctx.fillRect(x, y, size, size);
    }

    // Scatter polaroids
    const centerX = width / 2;
    const centerY = height / 2;
    
    const polaroids = images.slice(0, 8).map((_, index) => {
      const angle = (index / Math.min(images.length, 8)) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.25;
      const randomOffset = (Math.random() - 0.5) * 100;
      return {
        x: centerX + Math.cos(angle) * radius + randomOffset,
        y: centerY + Math.sin(angle) * radius * 0.6 + randomOffset,
        rotation: (Math.random() - 0.5) * 40,
        scale: 0.8 + Math.random() * 0.4,
      };
    });

    for (let i = 0; i < Math.min(images.length, polaroids.length); i++) {
      const img = images[i];
      const pos = polaroids[i];
      
      const baseWidth = Math.min(width, height) * 0.25 * pos.scale;
      const baseHeight = baseWidth * 1.2;
      const padding = baseWidth * 0.08;
      const photoWidth = baseWidth - padding * 2;
      const photoHeight = baseHeight - padding * 2 - baseWidth * 0.15;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate((pos.rotation * Math.PI) / 180);

      // Shadow
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;

      // Polaroid background
      ctx.fillStyle = "#ffffff";
      drawRoundedRect(ctx, -baseWidth/2, -baseHeight/2, baseWidth, baseHeight, 4);
      ctx.fill();

      ctx.shadowColor = "transparent";

      // Photo
      drawCoverImage(ctx, img, -photoWidth/2, -baseHeight/2 + padding, photoWidth, photoHeight, 2);

      ctx.restore();
    }

    // Center title
    if (config.includeTitle) {
      ctx.save();
      ctx.fillStyle = themeColors.text;
      ctx.font = `bold ${Math.min(width * 0.08, 80)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Text shadow for readability
      ctx.shadowColor = themeColors.bg;
      ctx.shadowBlur = 20;
      ctx.fillText(config.title, centerX, centerY);
      ctx.restore();

      if (config.includeDate) {
        ctx.font = `${Math.min(width * 0.03, 28)}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = themeColors.accent;
        const date = new Date().toLocaleDateString();
        ctx.fillText(date, centerX, centerY + 50);
      }
    }
  }, [config.includeTitle, config.includeDate, config.title, drawCoverImage]);

  const generatePoster = useCallback(async () => {
    if (photos.length === 0) return;

    setIsGenerating(true);
    setProgress(0);
    setPreviewUrl(null);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = RATIOS[config.ratio];
      canvas.width = width;
      canvas.height = height;

      // Load images
      const visiblePhotos = photos.filter((p) => p.is_visible).slice(0, 9);
      if (visiblePhotos.length === 0) {
        setIsGenerating(false);
        return;
      }

      const images: HTMLImageElement[] = [];
      for (let i = 0; i < visiblePhotos.length; i++) {
        const photo = visiblePhotos[i];
        const url = getR2PublicUrl(photo.storage_path);
        try {
          const img = await loadImage(url);
          images.push(img);
        } catch {
          // Skip failed images
        }
        setProgress(Math.round(((i + 1) / visiblePhotos.length) * 30));
      }

      setProgress(40);

      // Generate based on layout
      switch (config.layout) {
        case "classic":
          await generateClassicLayout(ctx, images, canvas.width, canvas.height, config.theme);
          break;
        case "hero":
          await generateHeroLayout(ctx, images, canvas.width, canvas.height, config.theme);
          break;
        case "collage":
          await generateCollageLayout(ctx, images, canvas.width, canvas.height, config.theme);
          break;
        case "mosaic":
          await generateMosaicLayout(ctx, images, canvas.width, canvas.height, config.theme);
          break;
        case "polaroid-wall":
          await generatePolaroidWallLayout(ctx, images, canvas.width, canvas.height, config.theme);
          break;
      }

      setProgress(100);

      // Generate preview
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setPreviewUrl(dataUrl);
    } finally {
      setIsGenerating(false);
    }
  }, [
    photos,
    config,
    loadImage,
    generateClassicLayout,
    generateHeroLayout,
    generateCollageLayout,
    generateMosaicLayout,
    generatePolaroidWallLayout,
  ]);

  const downloadPoster = useCallback(() => {
    if (!previewUrl) return;

    const ratio = RATIOS[config.ratio];
    const link = document.createElement("a");
    link.download = `${config.title.replace(/\s+/g, "_")}_poster_${ratio.width}x${ratio.height}.jpg`;
    link.href = previewUrl;
    link.click();
  }, [previewUrl, config.title, config.ratio]);

  const visiblePhotosCount = photos.filter((p) => p.is_visible).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuration */}
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Ratio Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  {t("selectRatio")}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(Object.keys(RATIOS) as PosterRatio[]).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setConfig((c) => ({ ...c, ratio }))}
                      className={`p-3 rounded-lg border transition-all text-sm ${
                        config.ratio === ratio
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {RATIOS[ratio].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4" />
                  {t("selectLayout")}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
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
                  {(Object.keys(THEMES) as PosterTheme[]).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setConfig((c) => ({ ...c, theme }))}
                      className={`flex-1 p-3 rounded-lg border transition-all ${
                        config.theme === theme
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-border hover:border-primary/50"
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${THEMES[theme].gradient[0]}, ${THEMES[theme].gradient[1]})`,
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

              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  {t("posterTitle")}
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig((c) => ({ ...c, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder={eventName}
                />
              </div>

              {/* Options */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeTitle}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, includeTitle: e.target.checked }))
                    }
                    className="rounded border-border"
                  />
                  <span className="text-sm">{t("includeTitle")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeDate}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, includeDate: e.target.checked }))
                    }
                    className="rounded border-border"
                  />
                  <span className="text-sm">{t("includeDate")}</span>
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
              <div 
                className="relative max-h-[500px] rounded-lg overflow-hidden border border-border bg-secondary mx-auto"
                style={{ aspectRatio: `${RATIOS[config.ratio].width} / ${RATIOS[config.ratio].height}` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Poster preview"
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
              onClick={generatePoster}
              disabled={isGenerating || visiblePhotosCount === 0}
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
              <Button onClick={downloadPoster} variant="secondary" className="gap-2">
                <Download className="h-4 w-4" />
                {t("download")}
              </Button>
            )}
          </div>

          {visiblePhotosCount === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              {t("noVisiblePhotos")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
