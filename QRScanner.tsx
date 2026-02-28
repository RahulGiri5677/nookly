import { useEffect, useRef, useState } from "react";
import { ScanLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  label?: string;
}

export function QRScanner({ onScan, onClose, label = "Scan QR Code" }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const scannerRef = useRef<any>(null);
  const containerId = "qr-scanner-container";

  useEffect(() => {
    let Html5QrcodeScanner: any;
    let instance: any;

    async function init() {
      try {
        const mod = await import("html5-qrcode");
        Html5QrcodeScanner = mod.Html5QrcodeScanner;
        instance = new Html5QrcodeScanner(
          containerId,
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: false,
            showZoomSliderIfSupported: false,
          },
          false
        );
        scannerRef.current = instance;
        instance.render(
          (decodedText: string) => {
            onScan(decodedText);
          },
          (errorMsg: string) => {
            // ignore scan errors — normal during camera search
          }
        );
        setStarted(true);
      } catch (e) {
        setError("Camera not available. Please allow camera access and try again.");
      }
    }

    init();

    return () => {
      if (instance) {
        instance.clear().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">{label}</span>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Scanner area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        {error ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground text-center">
              Point your camera at the QR code displayed by the host.
            </p>
            <div
              id={containerId}
              className="w-full max-w-sm rounded-2xl overflow-hidden border border-border"
              style={{ minHeight: 280 }}
            />
            {!started && (
              <p className="text-xs text-muted-foreground">Starting camera...</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
