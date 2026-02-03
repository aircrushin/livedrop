"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Photo } from "@/lib/supabase/types";

interface PhotoGridProps {
  photos: Photo[];
  eventId: string;
  eventSlug: string;
}

export function PhotoGrid({ photos, eventId, eventSlug }: PhotoGridProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const getImageUrl = (storagePath: string) => {
    const { data } = supabase.storage.from("event-photos").getPublicUrl(storagePath);
    return data.publicUrl;
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
    if (!confirm("Are you sure you want to delete this photo?")) return;
    
    setLoading(photo.id);
    
    // Delete from storage
    await supabase.storage
      .from("event-photos")
      .remove([photo.storage_path]);
    
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
        <p>No photos yet. Share the QR code with guests to start collecting!</p>
      </div>
    );
  }

  return (
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
                  title={photo.is_visible ? "Hide" : "Show"}
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
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
