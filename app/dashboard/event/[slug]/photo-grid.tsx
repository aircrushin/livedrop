"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2, Loader2, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getR2PublicUrl } from "@/lib/r2/utils";
import { deleteFromR2 } from "@/lib/r2/actions";
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
  const router = useRouter();
  const t = useTranslations('event');
  const supabase = createClient();

  const getImageUrl = (storagePath: string) => {
    return getR2PublicUrl(storagePath);
  };

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

    // Delete from R2 storage
    await deleteFromR2(photo.storage_path);

    // Delete from database
    await supabase
      .from("photos")
      .delete()
      .eq("id", photo.id);

    router.refresh();
    setLoading(null);
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t('noPhotosMessage')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Batch Download Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => setShowDownloadDialog(true)}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {t('downloadAll')}
        </Button>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`relative group aspect-square rounded-lg overflow-hidden ${
              !photo.is_visible ? "opacity-50" : ""
            }`}
          >
            <Image
              src={getImageUrl(photo.storage_path)}
              alt="Event photo"
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
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
          </div>
        ))}
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
