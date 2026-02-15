import Link from "next/link";
import { getTranslations } from 'next-intl/server';
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { DraggablePhotoCollage } from "@/components/landing/draggable-photo-collage";
import Image from "next/image";
import { Camera, Zap, QrCode } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

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

export default async function Home() {
  const t = await getTranslations('landing');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Shared dot-matrix background for the whole page */}
      <div className="pointer-events-none fixed inset-0 opacity-45 bg-[radial-gradient(hsl(var(--foreground)/0.18)_1px,transparent_1px)] bg-size-[18px_18px] z-0" />

      {/* Hero Section */}
      <header className="relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-linear-to-br from-accent/10 via-transparent to-primary/5 pointer-events-none" />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo variant="full" size="sm" className="h-7" />
            </Link>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              {user ? (
                <Button size="sm" asChild>
                  <Link href="/dashboard">{t('nav.dashboard')}</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">{t('nav.login')}</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/signup">{t('nav.getStarted')}</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>

        <div className="container mx-auto px-4 pb-20 pt-16 md:pb-28 md:pt-20 relative z-10">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-8 text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                <span className="text-primary">{t('hero.title1')}</span>
                <br />
                <span className="text-accent">{t('hero.title2')}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                {user ? (
                  <Button size="lg" className="w-full sm:w-auto" asChild>
                    <Link href="/dashboard">{t('nav.dashboard')}</Link>
                  </Button>
                ) : (
                  <Button size="lg" className="w-full sm:w-auto" asChild>
                    <Link href="/signup">{t('hero.hostEvent')}</Link>
                  </Button>
                )}
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-background/80 backdrop-blur-sm" asChild>
                  <Link href="/join">{t('hero.joinWithCode')}</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <DraggablePhotoCollage photos={HERO_PHOTOS} />
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="relative py-24 md:py-28 z-10">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl rounded-3xl border border-border/70 bg-card/55 p-6 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.85)] backdrop-blur-sm md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 md:mb-14">
              {t('features.title')}
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              <FeatureCard
                icon={<QrCode className="h-6 w-6" />}
                title={t('features.step1Title')}
                description={t('features.step1Desc')}
              />
              <FeatureCard
                icon={<Camera className="h-6 w-6" />}
                title={t('features.step2Title')}
                description={t('features.step2Desc')}
              />
              <FeatureCard
                icon={<Zap className="h-6 w-6" />}
                title={t('features.step3Title')}
                description={t('features.step3Desc')}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="relative py-24 md:py-28 z-10">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            {t('useCases.title')}
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            {t('useCases.subtitle')}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <UseCaseCard icon={<Image src="https://api.dicebear.com/9.x/lorelei/svg?backgroundColor=ffdfbf&seed=Wedding" alt="" width={40} height={40} className="rounded-full" unoptimized />} title={t('useCases.weddings')} />
            <UseCaseCard icon={<Image src="https://api.dicebear.com/9.x/lorelei/svg?backgroundColor=ffdfbf&seed=Conference" alt="" width={40} height={40} className="rounded-full" unoptimized />} title={t('useCases.conferences')} />
            <UseCaseCard icon={<Image src="https://api.dicebear.com/9.x/lorelei/svg?backgroundColor=ffdfbf&seed=Party" alt="" width={40} height={40} className="rounded-full" unoptimized />} title={t('useCases.parties')} />
            <UseCaseCard icon={<Image src="https://api.dicebear.com/9.x/lorelei/svg?backgroundColor=ffdfbf&seed=Meetup" alt="" width={40} height={40} className="rounded-full" unoptimized />} title={t('useCases.meetups')} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border/70 bg-card px-6 py-14 text-center shadow-[0_30px_80px_-48px_rgba(0,0,0,0.85)] md:px-10">
            <div className="pointer-events-none absolute -left-8 top-0 h-12 w-56 -rotate-3 rounded-b-3xl border-b border-border/60 bg-background/70" />
            <div className="pointer-events-none absolute -right-10 bottom-0 h-12 w-64 rotate-2 rounded-t-3xl border-t border-border/60 bg-background/70" />

            <h2 className="relative text-2xl md:text-3xl font-bold mb-4">
              {t('cta.title')}
            </h2>
            <p className="relative text-muted-foreground mb-8 max-w-md mx-auto">
              {t('cta.subtitle')}
            </p>
            {user ? (
              <Button size="lg" className="relative" asChild>
                <Link href="/dashboard">{t('nav.dashboard')}</Link>
              </Button>
            ) : (
              <Button size="lg" className="relative" asChild>
                <Link href="/signup">{t('cta.button')}</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/70 bg-card/35 py-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center">
              <Logo variant="full" size="sm" className="h-5" animated={false} />
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('footer.builtFor')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-border/70 bg-background/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_22px_40px_-30px_rgba(0,0,0,0.9)]">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function UseCaseCard({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/65 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_22px_40px_-32px_rgba(0,0,0,0.85)]">
      <div className="pointer-events-none absolute right-0 top-0 h-16 w-16 translate-x-6 -translate-y-6 rounded-full bg-accent/12 blur-xl transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-center gap-3">
        <div className="rounded-lg bg-accent/15 p-2 text-accent">{icon}</div>
        <span className="font-medium">{title}</span>
      </div>
    </div>
  );
}
