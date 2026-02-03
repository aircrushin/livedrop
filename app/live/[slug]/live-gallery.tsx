"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Event, Photo } from "@/lib/supabase/types";

interface LiveGalleryProps {
  event: Pick<Event, "id" | "name" | "slug">;
  initialPhotos: Photo[];
}

export function LiveGallery({ event, initialPhotos }: LiveGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [isConnected, setIsConnected] = useState(false);
  const supabase = createClient();

  const getImageUrl = (storagePath: string) => {
    const { data } = supabase.storage.from("event-photos").getPublicUrl(storagePath);
    return data.publicUrl;
  };

  useEffect(() => {
    // Subscribe to new photos
    const channel = supabase
      .channel(`photos:${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "photos",
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          const newPhoto = payload.new as Photo;
          if (newPhoto.is_visible) {
            setPhotos((prev) => [newPhoto, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "photos",
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          const updatedPhoto = payload.new as Photo;
          setPhotos((prev) => {
            if (updatedPhoto.is_visible) {
              // If photo is now visible and not in list, add it
              const exists = prev.find((p) => p.id === updatedPhoto.id);
              if (!exists) {
                return [updatedPhoto, ...prev];
              }
              // Update existing photo
              return prev.map((p) =>
                p.id === updatedPhoto.id ? updatedPhoto : p
              );
            } else {
              // Remove hidden photos
              return prev.filter((p) => p.id !== updatedPhoto.id);
            }
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "photos",
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          const deletedPhoto = payload.old as Photo;
          setPhotos((prev) => prev.filter((p) => p.id !== deletedPhoto.id));
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id, supabase]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
              <Camera className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-white/60 uppercase tracking-wide">LiveDrop</p>
              <p className="font-bold text-lg">{event.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            <span className="text-sm text-white/60">
              {isConnected ? "Live" : "Connecting..."}
            </span>
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <div className="min-h-screen flex flex-col items-center justify-center text-white/40">
          <Camera className="h-24 w-24 mb-6 opacity-30" />
          <p className="text-2xl font-medium mb-2">Waiting for photos...</p>
          <p className="text-lg">Guests can scan the QR code to start sharing</p>
        </div>
      ) : (
        <div className="pt-24 pb-8 px-4">
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 max-w-screen-2xl mx-auto">
            <AnimatePresence mode="popLayout">
              {photos.map((photo) => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  className="mb-4 break-inside-avoid"
                >
                  <div className="relative rounded-lg overflow-hidden bg-white/5">
                    <Image
                      src={getImageUrl(photo.storage_path)}
                      alt="Event photo"
                      width={400}
                      height={400}
                      className="w-full h-auto"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Connection indicator pulse */}
      {isConnected && (
        <div className="fixed bottom-4 right-4">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-white/60">{photos.length} photos</span>
          </div>
        </div>
      )}
    </div>
  );
}
