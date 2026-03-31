import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Camera, QrCode, Zap } from "lucide-react";
import { DraggablePhotoCollage } from "@/components/landing/draggable-photo-collage";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LiveDropLogo } from "@/components/livedrop-logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://livedrop.app";
const OG_IMAGE =
  "https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=1200&h=630&fit=crop";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seo");
  const title = t("homeTitle");
  const description = t("homeDescription");
  const keywords = t("homeKeywords");

  return {
    title: { absolute: title },
    description,
    keywords,
    alternates: {
      canonical: APP_URL,
    },
    openGraph: {
      type: "website",
      url: APP_URL,
      siteName: "LiveDrop",
      title,
      description,
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "LiveDrop - Real-time event photo sharing",
        },
      ],
      locale: "en_US",
      alternateLocale: ["zh_CN"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

const HERO_PHOTOS = [
  {
    id: "p1",
    src: "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=2600",
    alt: "Guests celebrating at an evening event",
    top: 7,
    left: 2,
    width: 170,
    height: 230,
    rotate: -2,
  },
  {
    id: "p2",
    src: "https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=2800",
    alt: "Group of friends at a party",
    top: 10,
    left: 28,
    width: 250,
    height: 320,
    rotate: 1,
  },
  {
    id: "p3",
    src: "https://images.pexels.com/photos/696218/pexels-photo-696218.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=2400",
    alt: "Cocktail glasses on a decorated event table",
    top: 8,
    left: 70,
    width: 150,
    height: 190,
    rotate: 2,
  },
  {
    id: "p4",
    src: "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=2600",
    alt: "Hands holding sparklers during a celebration",
    top: 53,
    left: 4,
    width: 240,
    height: 160,
    rotate: -1,
  },
  {
    id: "p5",
    src: "https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=2600",
    alt: "People dancing in colorful event lights",
    top: 52,
    left: 42,
    width: 190,
    height: 240,
    rotate: -3,
  },
  {
    id: "p6",
    src: "https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=2600",
    alt: "Stage lights and crowd at a live event",
    top: 56,
    left: 73,
    width: 180,
    height: 230,
    rotate: 1,
  },
];

async function LandingJsonLd() {
  const t = await getTranslations("seo");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "LiveDrop",
    description: t("homeDescription"),
    url: APP_URL,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Real-time photo sharing at events",
      "QR code based guest upload",
      "Live projector/gallery view",
      "No app download required",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function Home() {
  const t = await getTranslations("landing");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="relative min-h-screen bg-background pb-28 text-foreground md:pb-0">
      <LandingJsonLd />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(hsl(var(--foreground)/0.18)_1px,transparent_1px)] bg-size-[18px_18px] opacity-45" />

      <header className="relative z-10 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/10 via-transparent to-primary/5" />
        <div className="container relative z-10 mx-auto px-4 py-8">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <LiveDropLogo />
            </Link>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              {user ? (
                <Button size="sm" asChild>
                  <Link href="/dashboard">{t("nav.dashboard")}</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">{t("nav.login")}</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/signup">{t("nav.getStarted")}</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>

        <div className="container relative z-10 mx-auto px-4 pb-20 pt-16 md:pb-28 md:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-7 text-center lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/90">
                {t("hero.kicker")}
              </p>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                <span className="text-primary">{t("hero.title1")}</span>
                <br />
                <span className="text-accent">{t("hero.title2")}</span>
              </h1>
              <p className="mx-auto max-w-xl text-lg text-muted-foreground md:text-xl lg:mx-0">
                {t("hero.subtitle")}
              </p>

              <div className="grid gap-3 text-left sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur-sm">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                    {t("hero.hostLabel")}
                  </p>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {t("hero.hostHint")}
                  </p>
                  {user ? (
                    <Button size="lg" className="w-full" asChild>
                      <Link href="/dashboard">{t("nav.dashboard")}</Link>
                    </Button>
                  ) : (
                    <Button size="lg" className="w-full" asChild>
                      <Link href="/signup">{t("hero.hostEvent")}</Link>
                    </Button>
                  )}
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/40 p-4 backdrop-blur-sm">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                    {t("hero.guestLabel")}
                  </p>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {t("hero.guestHint")}
                  </p>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full bg-background/80 backdrop-blur-sm"
                    asChild
                  >
                    <Link href="/join">{t("hero.joinWithCode")}</Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <TrustTag text={t("hero.trustFast")} />
                <TrustTag text={t("hero.trustNoApp")} />
                <TrustTag text={t("hero.trustRealtime")} />
              </div>
            </div>

            <div className="relative">
              <DraggablePhotoCollage photos={HERO_PHOTOS} />
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="relative z-10 py-24 md:py-28" aria-labelledby="features-heading">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl rounded-3xl border border-border/70 bg-card/55 p-6 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.85)] backdrop-blur-sm md:p-10">
              <h2 id="features-heading" className="mb-10 text-center text-2xl font-bold md:mb-14 md:text-3xl">
                {t("features.title")}
              </h2>
              <div className="relative">
                <div className="absolute left-20 right-20 top-5 hidden border-t border-dashed border-border/70 md:block" />
                <div className="grid gap-5 md:grid-cols-3">
                  <FeatureStep
                    step="01"
                    icon={<QrCode className="h-5 w-5" />}
                    title={t("features.step1Title")}
                    description={t("features.step1Desc")}
                  />
                  <FeatureStep
                    step="02"
                    icon={<Camera className="h-5 w-5" />}
                    title={t("features.step2Title")}
                    description={t("features.step2Desc")}
                  />
                  <FeatureStep
                    step="03"
                    icon={<Zap className="h-5 w-5" />}
                    title={t("features.step3Title")}
                    description={t("features.step3Desc")}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 py-24 md:py-28" aria-labelledby="use-cases-heading">
          <div className="container mx-auto px-4">
            <h2 id="use-cases-heading" className="mb-4 text-center text-2xl font-bold md:text-3xl">
              {t("useCases.title")}
            </h2>
            <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
              {t("useCases.subtitle")}
            </p>
            <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-3">
              <UseCaseTag
                icon={
                  <Image
                    src="https://api.dicebear.com/9.x/lorelei/svg?backgroundColor=ffdfbf&seed=Wedding"
                    alt=""
                    width={20}
                    height={20}
                    className="rounded-full"
                    unoptimized
                  />
                }
                title={t("useCases.weddings")}
              />
              <UseCaseTag
                icon={
                  <Image
                    src="https://api.dicebear.com/9.x/lorelei/svg?backgroundColor=ffdfbf&seed=Conference"
                    alt=""
                    width={20}
                    height={20}
                    className="rounded-full"
                    unoptimized
                  />
                }
                title={t("useCases.conferences")}
              />
              <UseCaseTag
                icon={
                  <Image
                    src="https://api.dicebear.com/9.x/lorelei/svg?backgroundColor=ffdfbf&seed=Party"
                    alt=""
                    width={20}
                    height={20}
                    className="rounded-full"
                    unoptimized
                  />
                }
                title={t("useCases.parties")}
              />
              <UseCaseTag
                icon={
                  <Image
                    src="https://api.dicebear.com/9.x/lorelei/svg?backgroundColor=ffdfbf&seed=Meetup"
                    alt=""
                    width={20}
                    height={20}
                    className="rounded-full"
                    unoptimized
                  />
                }
                title={t("useCases.meetups")}
              />
            </div>
          </div>
        </section>

        <section className="relative z-10 py-24" aria-labelledby="cta-heading">
          <div className="container mx-auto px-4">
            <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border/70 bg-card px-6 py-14 text-center shadow-[0_30px_80px_-48px_rgba(0,0,0,0.85)] md:px-10">
              <div className="pointer-events-none absolute -left-8 top-0 h-12 w-56 -rotate-3 rounded-b-3xl border-b border-border/60 bg-background/70" />
              <div className="pointer-events-none absolute -right-10 bottom-0 h-12 w-64 rotate-2 rounded-t-3xl border-t border-border/60 bg-background/70" />

              <h2 id="cta-heading" className="relative mb-4 text-2xl font-bold md:text-3xl">
                {t("cta.title")}
              </h2>
              <p className="relative mx-auto mb-8 max-w-md text-muted-foreground">
                {t("cta.subtitle")}
              </p>
              {user ? (
                <Button size="lg" className="relative" asChild>
                  <Link href="/dashboard">{t("nav.dashboard")}</Link>
                </Button>
              ) : (
                <Button size="lg" className="relative" asChild>
                  <Link href="/signup">{t("cta.button")}</Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-4 bottom-4 z-20 md:hidden">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/70 bg-card/85 p-2 shadow-[0_20px_36px_-24px_rgba(0,0,0,0.95)] backdrop-blur">
          {user ? (
            <Button size="sm" asChild>
              <Link href="/dashboard">{t("nav.dashboard")}</Link>
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link href="/signup">{t("hero.hostEvent")}</Link>
            </Button>
          )}
          <Button size="sm" variant="outline" className="bg-background/80" asChild>
            <Link href="/join">{t("hero.joinWithCode")}</Link>
          </Button>
        </div>
      </div>

      <footer className="relative z-10 border-t border-border/70 bg-card/35 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center">
              <LiveDropLogo iconClassName="h-8 w-8 rounded-xl" />
            </Link>
            <p className="text-sm text-muted-foreground">{t("footer.builtFor")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TrustTag({ text }: { text: string }) {
  return (
    <div className="rounded-full border border-border/70 bg-background/60 px-3 py-2 text-center text-xs font-medium text-muted-foreground">
      {text}
    </div>
  );
}

function FeatureStep({
  step,
  icon,
  title,
  description,
}: {
  step: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="group relative rounded-2xl border border-border/70 bg-background/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_22px_40px_-30px_rgba(0,0,0,0.9)]">
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-accent/15 text-xs font-semibold tracking-[0.12em] text-accent">
          {step}
        </span>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
          {icon}
        </span>
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}

function UseCaseTag({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-full border border-border/70 bg-card/65 px-4 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_14px_30px_-22px_rgba(0,0,0,0.9)]">
      <div className="pointer-events-none absolute right-0 top-0 h-12 w-12 translate-x-4 -translate-y-4 rounded-full bg-accent/12 blur-xl transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-center gap-2.5">
        <div className="rounded-full bg-accent/15 p-1 text-accent">{icon}</div>
        <span className="text-sm font-medium">{title}</span>
      </div>
    </div>
  );
}
