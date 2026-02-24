"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2, Loader2, Download, CheckSquare, Square, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getR2PublicUrl } from "@/lib/r2/utils";
import { deleteFromR2, deleteMultipleFromR2 } from "@/lib/r2/actions";
import { BatchDownloadDialog } from "@/components/batch-download-dialog";
import type { Photo } from "@/lib/supabase/types";

interface PhotoGridProps {
  photos: Photo[];
  eventId: string;
  eventSlug: string;
  eventCreatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PhotoGrid({ photos, eventId, eventSlug, eventCreatedAt }: PhotoGridProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const router = useRouter();
  const t = useTranslations('event');
  const supabase = createClient();

  const getImageUrl = (storagePath: string) => {
    return getR2PublicUrl(storagePath);
  };

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

  async function deletePhoto(photo: Photo) {
    if (!confirm(t('confirmDeletePhoto'))) return;

    setLoading(photo.id);

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

  async function bulkDeleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(t('confirmBulkDelete', { count: selectedIds.size }))) return;

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

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t('noPhotosMessage')}</p>
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
              onClick={bulkDeleteSelected}
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
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={enterSelectMode}
            className="gap-2 min-w-[7.5rem]"
          >
            <CheckSquare className="h-4 w-4" />
            {t('selectPhotos')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDownloadDialog(true)}
            className="gap-2 min-w-[7.5rem]"
          >
            <Download className="h-4 w-4" />
            {t('downloadAll')}
          </Button>
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
              onClick={isSelectMode ? () => togglePhotoSelection(photo.id) : undefined}
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
                        onClick={() => toggleVisibility(photo)}
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
                        onClick={() => deletePhoto(photo)}
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

      {/* Batch Download Dialog */}
      <BatchDownloadDialog
        eventSlug={eventSlug}
        photoCount={photos.length}
        eventCreatedAt={eventCreatedAt}
        isOpen={showDownloadDialog}
        onClose={() => setShowDownloadDialog(false)}
      />
    </div>
  );
}
