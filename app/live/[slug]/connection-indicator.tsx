"use client";

interface ConnectionIndicatorProps {
  isConnected: boolean;
  photoCount: number;
  label: string;
}

export function ConnectionIndicator({ isConnected, photoCount, label }: ConnectionIndicatorProps) {
  if (!isConnected) return null;

  return (
    <div className="fixed bottom-4 right-4">
      <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-xs text-white/60">{photoCount} {label}</span>
      </div>
    </div>
  );
}
