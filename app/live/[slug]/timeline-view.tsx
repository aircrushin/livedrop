"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { CheckSquare, Square } from "lucide-react";
import { getR2PublicUrl } from "@/lib/r2/utils";
import { LikeButtonCompact } from "@/components/like-button";
import { CommentButtonCompact } from "@/components/comment-section";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import type { PhotoWithLikes } from "./page";

interface TimelineViewProps {
  photos: PhotoWithLikes[];
  isSelectMode: boolean;
  selectedPhotos: Set<string>;
  likedPhotos: Set<string>;
  currentUserId: string | null;
  onPhotoClick: (photo: PhotoWithLikes) => void;
  onToggleSelection: (photoId: string) => void;
  onLikeChange: (photoId: string, liked: boolean) => void;
}

interface GroupedPhotos {
  date: string;
  displayDate: string;
  photos: PhotoWithLikes[];
}

function formatDateLabel(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return locale === "zh" ? "今天" : "Today";
  if (isYesterday) return locale === "zh" ? "昨天" : "Yesterday";

  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function groupPhotosByDay(photos: PhotoWithLikes[], locale: string): GroupedPhotos[] {
  const groups: Map<string, PhotoWithLikes[]> = new Map();

  photos.forEach((photo) => {
    const date = new Date(photo.created_at);
    const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(photo);
  });

  return Array.from(groups.entries())
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .map(([dateKey, photos]) => ({
      date: dateKey,
      displayDate: formatDateLabel(dateKey, locale),
      photos: photos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    }));
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
        className={cn(
          "relative rounded-xl overflow-hidden bg-secondary/20 cursor-pointer",
          "transition-all duration-300 ease-out",
          "hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02]",
          "hover:bg-secondary/30",
          isSelected && "ring-4 ring-primary shadow-lg shadow-primary/20"
        )}
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

function DateDivider({ date, isFirst }: { date: string; isFirst: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex items-center justify-center gap-4", isFirst ? "mt-0 mb-6" : "my-6")}
    >
      {/* Left gradient line */}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/60 to-border/60 max-w-[120px]" />

      {/* Date pill */}
      <span className="px-4 py-1.5 text-sm font-medium text-muted-foreground bg-secondary/60 rounded-full">
        {date}
      </span>

      {/* Right gradient line */}
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border/60 to-border/60 max-w-[120px]" />
    </motion.div>
  );
}

function EmptyState({ locale }: { locale: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-[60vh] flex flex-col items-center justify-center text-muted-foreground/60"
    >
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl" />
        <svg
          className="relative h-24 w-24 opacity-40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <p className="text-2xl font-medium mb-2">
        {locale === "zh" ? "正在等待照片..." : "Waiting for photos..."}
      </p>
      <p className="text-lg">{locale === "zh" ? "扫描二维码上传照片" : "Scan QR code to upload photos"}</p>
    </motion.div>
  );
}

export function TimelineView({
  photos,
  isSelectMode,
  selectedPhotos,
  likedPhotos,
  currentUserId,
  onPhotoClick,
  onToggleSelection,
  onLikeChange,
}: TimelineViewProps) {
  const locale = useLocale();
  const groupedPhotos = groupPhotosByDay(photos, locale);

  if (photos.length === 0) {
    return (
      <div className="pt-24 pb-8 px-4">
        <EmptyState locale={locale} />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-8 px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-screen-2xl mx-auto"
      >
        {groupedPhotos.map((group, groupIndex) => (
          <div key={group.date}>
            <DateDivider date={group.displayDate} isFirst={groupIndex === 0} />

            {/* Photos masonry layout for this day */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4"
            >
              {group.photos.map((photo, index) => (
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
        ))}
      </motion.div>
    </div>
  );
}
