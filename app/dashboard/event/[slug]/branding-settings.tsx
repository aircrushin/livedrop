"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePlus, Upload, X, Palette, QrCode, Layout } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadBrandingImage } from "@/lib/r2/branding";
import { updateEventBranding } from "@/lib/supabase/event-actions";

interface BrandingConfig {
  logoUrl: string | null;
  bannerUrl: string | null;
  logoPosition: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  qrStyle: "default" | "rounded" | "dots";
  primaryColor: string;
  backgroundColor: string;
}

interface BrandingSettingsProps {
  eventId: string;
  initialBranding: BrandingConfig;
}

const defaultBranding: BrandingConfig = {
  logoUrl: null,
  bannerUrl: null,
  logoPosition: "center",
  qrStyle: "default",
  primaryColor: "#000000",
  backgroundColor: "#ffffff",
};

const logoPositions = [
  { value: "top-left", label: "左上", className: "items-start justify-start" },
  { value: "top-right", label: "右上", className: "items-start justify-end" },
  { value: "bottom-left", label: "左下", className: "items-end justify-start" },
  { value: "bottom-right", label: "右下", className: "items-end justify-end" },
] as const;

const qrStyles = [
  { value: "default", label: "默认" },
  { value: "rounded", label: "圆角" },
  { value: "dots", label: "圆点" },
] as const;

export function BrandingSettings({ eventId, initialBranding }: BrandingSettingsProps) {
  const t = useTranslations("branding");
  const [branding, setBranding] = useState<BrandingConfig>({
    ...defaultBranding,
    ...initialBranding,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
   const uploadIntervalRef = useRef<number | null>(null);

  const handleImageUpload = useCallback(
    async (file: File, type: "logo" | "banner") => {
      if (!file.type.startsWith("image/")) {
        setSaveMessage(t("invalidImageType"));
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setSaveMessage(t("imageTooLarge"));
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      if (uploadIntervalRef.current !== null) {
        window.clearInterval(uploadIntervalRef.current);
      }
      uploadIntervalRef.current = window.setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null) return 0;
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);
      setSaveMessage(null);

      try {
        const result = await uploadBrandingImage(file, eventId, type);
        if (result.error) {
          setSaveMessage(result.error);
        } else if (result.url) {
          setBranding((prev) => ({
            ...prev,
            [type === "logo" ? "logoUrl" : "bannerUrl"]: result.url,
          }));
          // Auto-save after upload
          const updatedBranding = {
            ...branding,
            [type === "logo" ? "logoUrl" : "bannerUrl"]: result.url,
          };
          await updateEventBranding(eventId, updatedBranding);
          setSaveMessage(t("uploadSuccess"));
        }
      } catch {
        setSaveMessage(t("uploadFailed"));
      } finally {
        if (uploadIntervalRef.current !== null) {
          window.clearInterval(uploadIntervalRef.current);
          uploadIntervalRef.current = null;
        }
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 500);
        setIsUploading(false);
      }
    },
    [eventId, branding, t]
  );

  const handleRemoveImage = useCallback(
    async (type: "logo" | "banner") => {
      setBranding((prev) => ({
        ...prev,
        [type === "logo" ? "logoUrl" : "bannerUrl"]: null,
      }));
      const updatedBranding = {
        ...branding,
        [type === "logo" ? "logoUrl" : "bannerUrl"]: null,
      };
      await updateEventBranding(eventId, updatedBranding);
      setSaveMessage(t("imageRemoved"));
    },
    [eventId, branding, t]
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const result = await updateEventBranding(eventId, branding);
      if (result.error) {
        setSaveMessage(result.error);
      } else {
        setSaveMessage(t("saveSuccess"));
        window.dispatchEvent(new CustomEvent("branding:updated", { detail: branding }));
      }
    } catch {
      setSaveMessage(t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }, [eventId, branding, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="logo" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="logo" className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              {t("logoTab")}
            </TabsTrigger>
            <TabsTrigger value="banner" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              {t("bannerTab")}
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              {t("styleTab")}
            </TabsTrigger>
          </TabsList>

          {/* Logo Tab */}
          <TabsContent value="logo" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t("logoUpload")}</Label>
              <div className="flex items-center gap-4">
                {branding.logoUrl ? (
                  <div className="relative">
                    <img
                      src={branding.logoUrl}
                      alt="Logo"
                      className="h-20 w-20 object-contain border rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => handleRemoveImage("logo")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-20 w-20 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                    <ImagePlus className="h-8 w-8" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    aria-label={t("uploadLogo")}
                    title={t("uploadLogo")}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, "logo");
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? t("uploading") : t("uploadLogo")}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("logoHint")}
                  </p>
                  {isUploading && uploadProgress !== null && (
                    <div className="mt-2 h-1 w-full rounded-full bg-muted/40">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {branding.logoUrl && (
              <div className="space-y-2">
                <Label>{t("logoPosition")}</Label>
                <div className="grid grid-cols-4 gap-2">
                  {logoPositions.map((pos) => (
                    <button
                      key={pos.value}
                      title={pos.label}
                      aria-label={pos.label}
                      onClick={() =>
                        setBranding((prev) => ({
                          ...prev,
                          logoPosition: pos.value,
                        }))
                      }
                      className={cn(
                        "aspect-square border-2 rounded-lg flex p-2 transition-colors",
                        branding.logoPosition === pos.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div
                        className={cn(
                          "w-full h-full flex",
                          pos.className
                        )}
                      >
                        <div className="w-3 h-3 bg-primary rounded-sm" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Banner Tab */}
          <TabsContent value="banner" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t("bannerUpload")}</Label>
              <div className="flex items-start gap-4">
                {branding.bannerUrl ? (
                  <div className="relative flex-1">
                    <img
                      src={branding.bannerUrl}
                      alt="Banner"
                      className="w-full h-32 object-cover border rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => handleRemoveImage("banner")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Layout className="h-8 w-8 mx-auto mb-2" />
                      <span className="text-sm">{t("noBanner")}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  aria-label={t("uploadBanner")}
                  title={t("uploadBanner")}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, "banner");
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? t("uploading") : t("uploadBanner")}
                </Button>
              </div>
              {isUploading && uploadProgress !== null && (
                <div className="mt-2 h-1 w-full rounded-full bg-muted/40">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">{t("bannerHint")}</p>
            </div>
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t("qrStyle")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {qrStyles.map((style) => (
                  <button
                    key={style.value}
                    onClick={() =>
                      setBranding((prev) => ({
                        ...prev,
                        qrStyle: style.value as BrandingConfig["qrStyle"],
                      }))
                    }
                    className={cn(
                      "px-4 py-2 border-2 rounded-lg text-sm transition-colors",
                      branding.qrStyle === style.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">{t("primaryColor")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) =>
                      setBranding((prev) => ({
                        ...prev,
                        primaryColor: e.target.value,
                      }))
                    }
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={branding.primaryColor}
                    onChange={(e) =>
                      setBranding((prev) => ({
                        ...prev,
                        primaryColor: e.target.value,
                      }))
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backgroundColor">{t("backgroundColor")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={branding.backgroundColor}
                    onChange={(e) =>
                      setBranding((prev) => ({
                        ...prev,
                        backgroundColor: e.target.value,
                      }))
                    }
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={branding.backgroundColor}
                    onChange={(e) =>
                      setBranding((prev) => ({
                        ...prev,
                        backgroundColor: e.target.value,
                      }))
                    }
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              {saveMessage && (
                <p
                  className={cn(
                    "text-sm",
                    saveMessage.includes(t("success").toLowerCase()) ||
                      saveMessage.includes(t("uploadSuccess"))
                      ? "text-green-500"
                      : "text-destructive"
                  )}
                >
                  {saveMessage}
                </p>
              )}
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t("saving") : t("saveSettings")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
