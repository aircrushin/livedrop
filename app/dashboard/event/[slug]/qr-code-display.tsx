"use client";

import QRCode from "react-qr-code";

interface QRCodeDisplayProps {
  url: string;
}

export function QRCodeDisplay({ url }: QRCodeDisplayProps) {
  return (
    <div className="bg-white p-4 rounded-lg flex items-center justify-center">
      <QRCode
        value={url}
        size={200}
        level="H"
      />
    </div>
  );
}
