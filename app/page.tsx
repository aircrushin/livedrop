import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Camera, Zap, Users, QrCode } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/5" />
        <div className="container mx-auto px-4 py-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                <Camera className="h-4 w-4 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold">LiveDrop</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </nav>
        </div>

        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              <span className="text-primary">Live photos.</span>
              <br />
              <span className="text-accent">Instant memories.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
              Create a live photo wall for your event. Guests scan a QR code, 
              snap photos, and watch them appear on the big screen instantly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Host an Event
                </Button>
              </Link>
              <Link href="/join">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Join with Code
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-16">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={<QrCode className="h-6 w-6" />}
              title="1. Create & Share"
              description="Create your event and share the QR code with guests. No app downloads required."
            />
            <FeatureCard
              icon={<Camera className="h-6 w-6" />}
              title="2. Snap Photos"
              description="Guests open the web app and take photos directly from their phones."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="3. Watch the Magic"
              description="Photos appear on your projector screen in real-time. Pure magic."
            />
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Perfect for any event
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            From intimate gatherings to large celebrations
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <UseCaseCard icon={<Users />} title="Weddings" />
            <UseCaseCard icon={<Users />} title="Conferences" />
            <UseCaseCard icon={<Users />} title="Parties" />
            <UseCaseCard icon={<Users />} title="Meetups" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-t from-accent/10 to-transparent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to create memories?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Set up your first event in under a minute. No credit card required.
          </p>
          <Link href="/signup">
            <Button size="lg">Create Your First Event</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center">
                <Camera className="h-3 w-3 text-accent-foreground" />
              </div>
              <span className="text-sm font-medium">LiveDrop</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for Builders Week
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
    <div className="text-center space-y-4 p-6">
      <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto text-accent">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
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
    <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-accent/50 transition-colors">
      <div className="text-accent">{icon}</div>
      <span className="font-medium">{title}</span>
    </div>
  );
}
