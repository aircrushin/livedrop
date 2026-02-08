"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit2, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface RenameEventModalProps {
  eventId: string;
  currentName: string;
  onClose: () => void;
}

export function RenameEventModal({ eventId, currentName, onClose }: RenameEventModalProps) {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const [newName, setNewName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!newName.trim()) {
      setError(t('eventNameRequired'));
      return;
    }

    if (newName.trim() === currentName) {
      onClose();
      return;
    }

    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("events")
      .update({ name: newName.trim() })
      .eq("id", eventId);

    if (updateError) {
      setError(updateError.message);
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
      <Card className="relative w-full max-w-md animate-in">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            {t('renameEvent')}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                {t('eventName')}
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Enter new event name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                autoFocus
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
              <Button type="submit" className="flex-1" disabled={loading || !newName.trim()}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('rename')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
