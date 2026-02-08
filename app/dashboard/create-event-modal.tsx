"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";

export function CreateEventModal() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError(t('mustBeLoggedIn'));
      setLoading(false);
      return;
    }

    const slug = generateSlug(name) + "-" + Math.random().toString(36).substring(2, 6);

    const { error: insertError } = await supabase
      .from("events")
      .insert({
        name,
        slug,
        host_id: user.id,
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setIsOpen(false);
    setName("");
    router.refresh();
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        {t('newEvent')}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      <Card className="relative w-full max-w-md animate-in">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('createNewEvent')}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
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
                placeholder="e.g. Sarah's Wedding"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                {tCommon('cancel')}
              </Button>
              <Button type="submit" className="flex-1" disabled={loading || !name}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('createEvent')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
