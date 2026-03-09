"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Trash2, Loader2, Download, CheckSquare, Square, X, AlertTriangle, Upload, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getR2PublicUrl } from "@/lib/r2/utils";
import { deleteFromR2, deleteMultipleFromR2, uploadToR2 } from "@/lib/r2/actions";
import { compressImage } from "@/lib/utils/image-compression";
import { BatchDownloadDialog } from "@/components/batch-download-dialog";
import { SmartAlbumGenerator } from "./smart-album-generator";
import type { Photo } from "@/lib/supabase/types";

interface PhotoGridProps {
  photos: Photo[];
  eventId: string;
  eventSlug: string;
  eventCreatedAt: string;
}

export function PhotoGrid({ photos, eventId, eventSlug, eventCreatedAt }: PhotoGridProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [photoActionTarget, setPhotoActionTarget] = useState<Photo | null>(null);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const [showAlbumGenerator, setShowAlbumGenerator] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const t = useTranslations('event');
  const tCommon = useTranslations('common');
  const supabase = createClient();

  const getImageUrl = (storagePath: string) => {
    return getR2PublicUrl(storagePath);
  };

  async function handleUploadFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = "";

    setIsUploading(true);
    setUploadProgress({ completed: 0, total: files.length });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let successCount = 0;
      let processedCount = 0;
      for (const file of files) {
        try {
          const compressedBlob = await compressImage(file, 1920, 1920, 0.85);
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substr(2, 6);
          const fileName = `${eventSlug}/${user.id}-${timestamp}-${randomStr}.jpg`;
          const arrayBuffer = await compressedBlob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          const uploadResult = await uploadToR2(fileName, uint8Array, "image/jpeg");
          if (!uploadResult.success) continue;

          const { error: insertError } = await supabase.from("photos").insert({
            event_id: eventId,
            user_id: user.id,
            storage_path: fileName,
          });

          if (!insertError) successCount++;
        } catch {
          // continue with next file
        } finally {
          processedCount += 1;
          setUploadProgress({ completed: processedCount, total: files.length });
        }
      }

      if (successCount > 0) {
        toast.success(t('uploadSuccess', { count: successCount }));
        router.refresh();
      } else {
        toast.error(t('uploadFailed'));
      }
    } catch {
      toast.error(t('uploadFailed'));
    } finally {
      setIsUploading(false);
      window.setTimeout(() => setUploadProgress(null), 1200);
    }
  }

  function enterSelectMode() {
    setIsSelectMode(true);
    setSelectedIds(new Set());
  }

  function exitSelectMode() {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  }

  function togglePhotoSelection(photoId: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(photos.map(p => p.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  async function toggleVisibility(photo: Photo) {
    setLoading(photo.id);
    
    await supabase
      .from("photos")
      .update({ is_visible: !photo.is_visible })
      .eq("id", photo.id);

    router.refresh();
    setLoading(null);
  }

  async function doDeletePhoto(photo: Photo) {
    setLoading(photo.id);
    setPhotoToDelete(null);

    try {
      const r2Result = await deleteFromR2(photo.storage_path);
      if (!r2Result.success) {
        toast.error(t('photoDeleteFailed'));
        setLoading(null);
        return;
      }

      const { error: dbError } = await supabase
        .from("photos")
        .delete()
        .eq("id", photo.id);

      if (dbError) {
        toast.error(t('photoDeleteFailed'));
        setLoading(null);
        return;
      }

      toast.success(t('photoDeleted'));
      router.refresh();
    } catch {
      toast.error(t('photoDeleteFailed'));
    } finally {
      setLoading(null);
    }
  }

  async function doBulkDeleteSelected() {
    if (selectedIds.size === 0) return;
    setShowBulkDeleteModal(false);
    setIsBulkDeleting(true);

    try {
      const selectedPhotos = photos.filter(p => selectedIds.has(p.id));
      const storagePaths = selectedPhotos.map(p => p.storage_path);

      const r2Result = await deleteMultipleFromR2(storagePaths);
      if (!r2Result.success) {
        toast.error(t('bulkDeleteFailed'));
        setIsBulkDeleting(false);
        return;
      }

      const { error: dbError } = await supabase
        .from("photos")
        .delete()
        .in("id", Array.from(selectedIds));

      if (dbError) {
        toast.error(t('bulkDeleteFailed'));
        setIsBulkDeleting(false);
        return;
      }

      toast.success(t('bulkDeleteSuccess', { count: selectedIds.size }));
      exitSelectMode();
      router.refresh();
    } catch {
      toast.error(t('bulkDeleteFailed'));
    } finally {
      setIsBulkDeleting(false);
    }
  }

  function openBulkDeleteModal() {
    if (selectedIds.size === 0) return;
    setShowBulkDeleteModal(true);
  }

  function openMobileActionModal(photo: Photo) {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 639px)").matches) {
      setPhotoActionTarget(photo);
    }
  }

  const uploadPercent = uploadProgress ? Math.round((uploadProgress.completed / uploadProgress.total) * 100) : 0;
  const uploadCurrent = uploadProgress
    ? Math.min(
        uploadProgress.completed + (isUploading && uploadProgress.completed < uploadProgress.total ? 1 : 0),
        uploadProgress.total
      )
    : 0;

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground space-y-4">
        <p>{t('noPhotosMessage')}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => uploadInputRef.current?.click()}
          disabled={isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? t('uploading') : t('uploadPhotos')}
        </Button>
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          multiple
          aria-label={t('uploadPhotos')}
          onChange={handleUploadFiles}
          className="hidden"
        />
        {uploadProgress && (
          <div className="mx-auto w-full max-w-xs">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('uploadingCount', { current: uploadCurrent, total: uploadProgress.total })}</span>
              <span>{uploadPercent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted/40">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${uploadPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  const allSelected = selectedIds.size === photos.length;
  const noneSelected = selectedIds.size === 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {isSelectMode ? (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t('selectedCount', { count: selectedIds.size, total: photos.length })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={allSelected ? deselectAll : selectAll}
            >
              {allSelected ? t('deselectAll') : t('selectAll')}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={noneSelected || isBulkDeleting}
              onClick={openBulkDeleteModal}
              className="gap-1.5"
            >
              {isBulkDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {t('bulkDelete')}
              {selectedIds.size > 0 && (
                <span className="ml-0.5 bg-white/20 text-white text-xs rounded px-1.5 py-0.5 leading-none">
                  {selectedIds.size}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exitSelectMode}
              className="gap-1.5"
            >
              <X className="h-4 w-4" />
              {t('cancelSelection')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-end gap-1.5 sm:gap-2">
          {/* Primary Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={enterSelectMode}
            className="h-8 sm:h-9 gap-1.5 px-2 sm:px-3 text-xs sm:text-sm"
          >
            <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('selectPhotos')}</span>
            <span className="sm:hidden">{t('select')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => uploadInputRef.current?.click()}
            disabled={isUploading}
            className="h-8 sm:h-9 gap-1.5 px-2 sm:px-3 text-xs sm:text-sm"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
            <span className="hidden sm:inline">{isUploading ? t('uploading') : t('uploadPhotos')}</span>
            <span className="sm:hidden">{t('upload')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDownloadDialog(true)}
            className="h-8 sm:h-9 gap-1.5 px-2 sm:px-3 text-xs sm:text-sm"
          >
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('downloadAll')}</span>
            <span className="sm:hidden">{t('download')}</span>
          </Button>
          
          {/* Generator Actions */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAlbumGenerator(true)}
            disabled={photos.filter((p) => p.is_visible).length === 0}
            className="h-8 sm:h-9 gap-1.5 px-2 sm:px-3 text-xs sm:text-sm"
          >
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('smartAlbum')}</span>
            <span className="sm:hidden">{t('album')}</span>
          </Button>
          {/* <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowPosterGenerator(true)}
            disabled={photos.filter((p) => p.is_visible).length === 0}
            className="h-8 sm:h-9 gap-1.5 px-2 sm:px-3 text-xs sm:text-sm"
          >
            <LayoutTemplate className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('posterCollage')}</span>
            <span className="sm:hidden">{t('poster')}</span>
          </Button> */}
        </div>
      )}

      {uploadProgress && (
        <div className="rounded-md border border-border/60 p-3">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('uploadingCount', { current: uploadCurrent, total: uploadProgress.total })}</span>
            <span>{uploadPercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/40">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${uploadPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((photo) => {
          const isSelected = selectedIds.has(photo.id);
          return (
            <div
              key={photo.id}
              className={`relative group aspect-square rounded-lg overflow-hidden cursor-pointer ${
                !photo.is_visible && !isSelectMode ? "opacity-50" : ""
              } ${isSelectMode ? "cursor-pointer" : ""} ${
                isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
              }`}
              onClick={isSelectMode ? () => togglePhotoSelection(photo.id) : () => openMobileActionModal(photo)}
            >
              <Image
                src={getImageUrl(photo.storage_path)}
                alt="Event photo"
                fill
                unoptimized
                className={`object-cover transition-opacity ${
                  isSelectMode && !isSelected && !photo.is_visible ? "opacity-50" : ""
                } ${isSelectMode && !isSelected ? "brightness-75" : ""}`}
                sizes="(max-width: 768px) 50vw, 25vw"
              />

              {/* Select mode: checkbox indicator */}
              {isSelectMode && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`rounded-full p-1 transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground scale-110"
                      : "bg-black/50 text-white"
                  }`}>
                    {isSelected ? (
                      <CheckSquare className="h-6 w-6" />
                    ) : (
                      <Square className="h-6 w-6" />
                    )}
                  </div>
                </div>
              )}

              {/* Normal mode: hover action buttons */}
              {!isSelectMode && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {loading === photo.id ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisibility(photo);
                        }}
                        title={photo.is_visible ? t('hide') : t('show')}
                      >
                        {photo.is_visible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); setPhotoToDelete(photo); }}
                        title={t('delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hidden file input for upload */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        multiple
        aria-label={t('uploadPhotos')}
        onChange={handleUploadFiles}
        className="hidden"
      />

      {/* Batch Download Dialog */}
      <BatchDownloadDialog
        eventSlug={eventSlug}
        photoCount={photos.length}
        eventCreatedAt={eventCreatedAt}
        isOpen={showDownloadDialog}
        onClose={() => setShowDownloadDialog(false)}
      />

      {/* Smart Album Generator */}
      <SmartAlbumGenerator
        photos={photos}
        eventName={eventSlug}
        isOpen={showAlbumGenerator}
        onClose={() => setShowAlbumGenerator(false)}
      />

      {/* Poster Collage Generator
      <PosterCollageGenerator
        photos={photos}
        eventName={eventSlug}
        isOpen={showPosterGenerator}
        onClose={() => setShowPosterGenerator(false)}
      /> */}

      {/* Single photo delete confirmation modal */}
      {photoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPhotoToDelete(null)}
          />
          <Card className="relative w-full max-w-md animate-in border-destructive/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {t('delete')}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPhotoToDelete(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('confirmDeletePhoto')}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setPhotoToDelete(null)}
                  >
                    {tCommon('cancel')}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => photoToDelete && doDeletePhoto(photoToDelete)}
                  >
                    {t('delete')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mobile photo actions modal */}
      {photoActionTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPhotoActionTarget(null)}
          />
          <Card className="relative w-full max-w-md animate-in">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">{t('photos')}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPhotoActionTarget(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="button"
                variant="secondary"
                className="w-full gap-2"
                disabled={loading === photoActionTarget.id}
                onClick={() => {
                  void toggleVisibility(photoActionTarget);
                  setPhotoActionTarget(null);
                }}
              >
                {loading === photoActionTarget.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : photoActionTarget.is_visible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {photoActionTarget.is_visible ? t('hide') : t('show')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="w-full gap-2"
                disabled={loading === photoActionTarget.id}
                onClick={() => {
                  setPhotoToDelete(photoActionTarget);
                  setPhotoActionTarget(null);
                }}
              >
                <Trash2 className="h-4 w-4" />
                {t('delete')}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk delete confirmation modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBulkDeleteModal(false)}
          />
          <Card className="relative w-full max-w-md animate-in border-destructive/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {t('bulkDelete')}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBulkDeleteModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('confirmBulkDelete', { count: selectedIds.size })}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowBulkDeleteModal(false)}
                  >
                    {tCommon('cancel')}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => doBulkDeleteSelected()}
                  >
                    {t('bulkDelete')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
