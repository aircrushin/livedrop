"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Loader2 } from "lucide-react";
import { useTranslations } from 'next-intl';

export default function JoinPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('join');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    // Navigate to the event camera view
    const slug = code.toLowerCase().replace(/\s+/g, "-");
    router.push(`/e/${slug}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
              <Camera className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-2xl font-bold">LiveDrop</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  {t('eventCode')}
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="e.g. sarahs-wedding"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="text-center text-lg"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !code}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('submit')}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-6">
              {t('hostPrompt')}{" "}
              <Link href="/signup" className="text-accent hover:underline">
                {t('signUp')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
