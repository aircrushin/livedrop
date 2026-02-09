"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteMultipleFromR2 } from "@/lib/r2/actions";

interface DeleteEventModalProps {
  eventId: string;
  eventName: string;
  onClose: () => void;
}

export function DeleteEventModal({ eventId, eventName, onClose }: DeleteEventModalProps) {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const router = useRouter();

  async function handleDelete() {
    if (confirmText !== eventName) {
      setError(t('confirmError'));
      return;
    }

    setError("");
    setLoading(true);

    const supabase = createClient();

    const { data: photos } = await supabase
      .from("photos")
      .select("storage_path")
      .eq("event_id", eventId);

    if (photos && photos.length > 0) {
      const storagePaths = photos.map(p => p.storage_path);
      await deleteMultipleFromR2(storagePaths);
    }

    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-md animate-in border-destructive/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t('deleteEvent')}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t('deleteWarning')}
                <span className="font-semibold text-foreground"> &quot;{eventName}&quot; </span>
                {t('deleteWarningPhotos')}
              </p>
              <p className="text-sm font-medium">
                {t('typeToConfirm')} <code className="bg-secondary px-1.5 py-0.5 rounded">{eventName}</code>
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                placeholder={eventName}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                {tCommon('cancel')}
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                className="flex-1" 
                disabled={loading || confirmText !== eventName}
                onClick={handleDelete}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('deleteEvent')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
