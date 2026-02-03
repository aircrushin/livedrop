import { Loader2 } from "lucide-react";

export default function CameraLoading() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-white" />
    </div>
  );
}
