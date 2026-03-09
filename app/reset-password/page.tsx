"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "@/lib/supabase/actions";
import { LiveDropLogo } from "@/components/livedrop-logo";

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    // Handle the password reset callback from Supabase
    const handlePasswordReset = async () => {
      const supabase = createClient();
      
      // Check for PKCE code in URL
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      
      if (code) {
        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError(t('invalidLink'));
        }
      } else {
        // Check for existing session (in case of older hash-based flow)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          setError(t('invalidLink'));
        }
      }
      
      setValidating(false);
    };
    
    handlePasswordReset();
  }, [t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t('passwordsMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("password", password);

    const result = await updatePassword(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Success - will be redirected by server action
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <LiveDropLogo />
            </Link>
          </div>
          <Card>
            <CardContent className="py-8">
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <LiveDropLogo />
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                  {error}
                  {error === t('invalidLink') && (
                    <div className="mt-2">
                      <Link href="/forgot-password" className="text-accent hover:underline">
                        {t('requestNewLink')}
                      </Link>
                    </div>
                  )}
                </div>
              )}
              {error !== t('invalidLink') && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      {t('newPassword')}
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                      {t('confirmPassword')}
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('submit')}
                  </Button>
                </>
              )}
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-accent hover:underline">
                  {t('backToLogin')}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
