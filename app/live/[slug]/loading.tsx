import { Camera, Loader2 } from "lucide-react";

export default function LiveLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <Camera className="h-16 w-16 mb-6 opacity-30" />
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
