import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Camera, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-6">
        <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
          <Camera className="h-10 w-10 text-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
