import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Camera, Home } from "lucide-react";
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-6">
        <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
          <Camera className="h-10 w-10 text-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4 mr-2" />
            {t('goHome')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
