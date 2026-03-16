"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { CheckSquare, Square } from "lucide-react";
import { getR2PublicUrl } from "@/lib/r2/utils";
import { LikeButtonCompact } from "@/components/like-button";
import { CommentButtonCompact } from "@/components/comment-section";
import type { PhotoWithLikes } from "./page";

interface PhotoGridProps {
  photos: PhotoWithLikes[];
  isSelectMode: boolean;
  selectedPhotos: Set<string>;
  likedPhotos: Set<string>;
  currentUserId: string | null;
  onPhotoClick: (photo: PhotoWithLikes) => void;
  onToggleSelection: (photoId: string) => void;
  onLikeChange: (photoId: string, liked: boolean) => void;
}

function PhotoItem({
  photo,
  index,
  isSelectMode,
  isSelected,
  currentUserId,
  isLiked,
  onClick,
  onToggleSelection,
  onLikeChange,
}: {
  photo: PhotoWithLikes;
  index: number;
  isSelectMode: boolean;
  isSelected: boolean;
  currentUserId: string | null;
  isLiked: boolean;
  onClick: () => void;
  onToggleSelection: (e: React.MouseEvent) => void;
  onLikeChange: (liked: boolean) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay: index < 8 ? index * 0.05 : 0,
      }}
      className="mb-4 break-inside-avoid"
    >
      <div
        className={`relative rounded-xl overflow-hidden bg-secondary/20 cursor-pointer transition-all duration-300 ease-out hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02] hover:bg-secondary/30 ${
          isSelected ? "ring-4 ring-primary shadow-lg shadow-primary/20" : ""
        }`}
        onClick={onClick}
      >
        {isSelectMode && (
          <div className="absolute top-3 right-3 z-10" onClick={onToggleSelection}>
            {isSelected ? (
              <CheckSquare className="h-6 w-6 text-primary fill-primary drop-shadow-md" />
            ) : (
              <Square className="h-6 w-6 text-white/80 drop-shadow-md" />
            )}
          </div>
        )}
        
        {/* Interaction overlay */}
        {!isSelectMode && currentUserId && (
          <div 
            className="absolute bottom-2 left-2 right-2 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <LikeButtonCompact
              photoId={photo.id}
              userId={currentUserId}
              initialLiked={isLiked}
              initialCount={photo.likes_count}
              onLikeChange={onLikeChange}
            />
            <CommentButtonCompact
              photoId={photo.id}
              userId={currentUserId}
              initialCount={photo.comments_count}
            />
          </div>
        )}

        <Image
          src={getR2PublicUrl(photo.storage_path)}
          alt="Event photo"
          width={400}
          height={400}
          unoptimized
          className="w-full h-auto"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
    </motion.div>
  );
}

export function PhotoGrid({
  photos,
  isSelectMode,
  selectedPhotos,
  likedPhotos,
  currentUserId,
  onPhotoClick,
  onToggleSelection,
  onLikeChange,
}: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-muted-foreground/60">
        <svg className="h-24 w-24 mb-6 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-2xl font-medium mb-2">正在等待照片...</p>
        <p className="text-lg">扫描二维码上传照片</p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 max-w-screen-2xl mx-auto"
      >
        {photos.map((photo, index) => (
          <PhotoItem
            key={photo.id}
            photo={photo}
            index={index}
            isSelectMode={isSelectMode}
            isSelected={selectedPhotos.has(photo.id)}
            currentUserId={currentUserId}
            isLiked={likedPhotos.has(photo.id)}
            onClick={() => onPhotoClick(photo)}
            onToggleSelection={(e) => {
              e.stopPropagation();
              onToggleSelection(photo.id);
            }}
            onLikeChange={(liked) => onLikeChange(photo.id, liked)}
          />
        ))}
      </motion.div>
    </div>
  );
}
