import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import QrScanner from 'qr-scanner';

export interface ScanResult {
  readonly data: string;
  readonly cornerPoints?: ReadonlyArray<{ x: number; y: number }>;
}

export interface ActiveScanner {
  stop(): void;
  setCamera(deviceId: string): Promise<void>;
  toggleFlash(): Promise<boolean>;
  hasFlash(): Promise<boolean>;
}

@Injectable({ providedIn: 'root' })
export class QrScannerService {
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId)
      && typeof navigator !== 'undefined'
      && !!navigator.mediaDevices
      && typeof navigator.mediaDevices.getUserMedia === 'function';
  }

  async listCameras(): Promise<{ id: string; label: string }[]> {
    if (!this.isSupported()) return [];
    try {
      const cams = await QrScanner.listCameras(true);
      return cams.map((c) => ({ id: c.id, label: c.label }));
    } catch {
      return [];
    }
  }

  start(
    video: HTMLVideoElement,
    onResult: (r: ScanResult) => void,
    onError?: (err: unknown) => void,
  ): ActiveScanner {
    const scanner = new QrScanner(
      video,
      (r) => onResult({ data: r.data, cornerPoints: r.cornerPoints }),
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: 'environment',
        maxScansPerSecond: 8,
        returnDetailedScanResult: true,
      },
    );
    scanner.start().catch((err) => onError?.(err));

    return {
      stop: () => { scanner.stop(); scanner.destroy(); },
      setCamera: (deviceId: string) => scanner.setCamera(deviceId),
      toggleFlash: () => scanner.toggleFlash().then(() => scanner.isFlashOn()),
      hasFlash: () => scanner.hasFlash(),
    };
  }

  /** Decode a QR code from an image File (e.g. uploaded photo). */
  async decodeFile(file: File): Promise<ScanResult | null> {
    try {
      const r = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      return { data: r.data, cornerPoints: r.cornerPoints };
    } catch {
      return null;
    }
  }
}
