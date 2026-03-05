import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveDropLogo } from "@/components/livedrop-logo";

interface EventUnavailableStateProps {
  reason: "not_found" | "ended";
}

export async function EventUnavailableState({ reason }: EventUnavailableStateProps) {
  const t = await getTranslations("event");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center">
            <LiveDropLogo />
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>
              {reason === "ended" ? t("eventEndedTitle") : t("eventNotFoundTitle")}
            </CardTitle>
            <CardDescription>
              {reason === "ended" ? t("eventEndedDesc") : t("eventNotFoundDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/join">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t("reenterEventCode")}
              </Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("contactHostHint")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
