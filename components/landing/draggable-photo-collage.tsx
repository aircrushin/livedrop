"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

interface CollagePhoto {
  id: string;
  src: string;
  alt: string;
  top: number;
  left: number;
  width: number;
  height: number;
  rotate?: number;
}

interface PhotoState {
  x: number;
  y: number;
  z: number;
}

interface DragState {
  id: string;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
}

export function DraggablePhotoCollage({ photos }: { photos: CollagePhoto[] }) {
  const initialStates = useMemo<Record<string, PhotoState>>(
    () =>
      photos.reduce((acc, photo, index) => {
        acc[photo.id] = { x: 0, y: 0, z: index + 1 };
        return acc;
      }, {} as Record<string, PhotoState>),
    [photos],
  );

  const [photoStates, setPhotoStates] = useState<Record<string, PhotoState>>(initialStates);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const zIndexRef = useRef(photos.length + 1);

  useEffect(() => {
    setPhotoStates(initialStates);
  }, [initialStates]);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      setPhotoStates((current) => {
        const active = current[dragState.id];
        if (!active) {
          return current;
        }

        const deltaX = event.clientX - dragState.startX;
        const deltaY = event.clientY - dragState.startY;

        return {
          ...current,
          [dragState.id]: {
            ...active,
            x: dragState.baseX + deltaX,
            y: dragState.baseY + deltaY,
          },
        };
      });
    };

    const handlePointerUp = () => {
      setDragState(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [dragState]);

  const handlePointerDown = (photoId: string, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();

    zIndexRef.current += 1;

    setPhotoStates((current) => {
      const active = current[photoId];
      if (!active) {
        return current;
      }

      return {
        ...current,
        [photoId]: {
          ...active,
          z: zIndexRef.current,
        },
      };
    });

    const currentState = photoStates[photoId];
    setDragState({
      id: photoId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: currentState?.x ?? 0,
      baseY: currentState?.y ?? 0,
    });
  };

  return (
    <div className="relative h-104 w-full overflow-hidden rounded-4xl border border-border/60 bg-card/40 backdrop-blur-sm md:h-128">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-size-[4rem_4rem]" />
      <div className="absolute inset-0 bg-linear-to-br from-background/10 via-background/40 to-background/75" />

      {photos.map((photo) => {
        const state = photoStates[photo.id] ?? { x: 0, y: 0, z: 0 };

        return (
          <button
            key={photo.id}
            type="button"
            onDoubleClick={() =>
              setPhotoStates((current) => ({
                ...current,
                [photo.id]: {
                  ...(current[photo.id] ?? { z: state.z }),
                  x: 0,
                  y: 0,
                },
              }))
            }
            onPointerDown={(event) => handlePointerDown(photo.id, event)}
            className="group absolute overflow-hidden rounded-sm border border-white/30 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.75)] transition-transform duration-200 ease-out hover:scale-[1.015] active:cursor-grabbing"
            style={{
              top: `${photo.top}%`,
              left: `${photo.left}%`,
              width: `${photo.width}px`,
              height: `${photo.height}px`,
              zIndex: state.z,
              transform: `translate(${state.x}px, ${state.y}px) rotate(${photo.rotate ?? 0}deg)`,
              cursor: dragState?.id === photo.id ? "grabbing" : "grab",
              touchAction: "none",
            }}
            aria-label={`Draggable photo: ${photo.alt}`}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              quality={95}
              className="object-cover transition duration-300 group-hover:scale-[1.04]"
              sizes="(max-width: 768px) 240px, 420px"
            />
          </button>
        );
      })}
    </div>
  );
}
