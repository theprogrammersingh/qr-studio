import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

import { QrPayloadService } from '../../core/qr-payload.service';
import { QrScannerService, type ActiveScanner, type ScanResult } from '../../core/qr-scanner.service';
import { QrStorageService } from '../../core/qr-storage.service';
import { findType } from '../../data/qr-types.data';

interface DecodedView {
  readonly text: string;
  readonly typeId: string;
  readonly typeLabel: string;
  readonly link: string | null;
  readonly at: number;
}

@Component({
  selector: 'app-scan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './scan.html',
  styleUrl: './scan.scss',
})
export class Scan implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly scannerSvc = inject(QrScannerService);
  private readonly payloadSvc = inject(QrPayloadService);
  private readonly storage = inject(QrStorageService);

  protected readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  protected readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly supported = signal<boolean>(true);
  protected readonly running = signal<boolean>(false);
  protected readonly error = signal<string>('');
  protected readonly cameras = signal<{ id: string; label: string }[]>([]);
  protected readonly currentCamera = signal<string>('');
  protected readonly hasFlash = signal<boolean>(false);
  protected readonly result = signal<DecodedView | null>(null);
  protected readonly savedAt = signal<number | null>(null);

  protected readonly hasResult = computed(() => this.result() !== null);

  private active: ActiveScanner | null = null;
  private lastDecoded = '';
  private lastSavedPayload = '';

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.scannerSvc.isSupported()) {
      this.supported.set(false);
      this.error.set('This browser does not expose a camera API.');
      return;
    }
    await this.start();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  protected async start(): Promise<void> {
    this.error.set('');
    try {
      this.active = this.scannerSvc.start(
        this.video().nativeElement,
        (r) => this.onDecoded(r),
        (err) => this.error.set(this.normaliseError(err)),
      );
      this.running.set(true);
      // List cameras *after* start (permission has been granted by then).
      this.cameras.set(await this.scannerSvc.listCameras());
      this.hasFlash.set(await this.active.hasFlash());
    } catch (err) {
      this.error.set(this.normaliseError(err));
    }
  }

  protected stop(): void {
    this.active?.stop();
    this.active = null;
    this.running.set(false);
    this.hasFlash.set(false);
  }

  protected async setCamera(ev: Event): Promise<void> {
    const id = (ev.target as HTMLSelectElement).value;
    this.currentCamera.set(id);
    if (this.active) {
      try { await this.active.setCamera(id); }
      catch (err) { this.error.set(this.normaliseError(err)); }
    }
  }

  protected async toggleFlash(): Promise<void> {
    if (!this.active) return;
    try { await this.active.toggleFlash(); }
    catch { /* unsupported */ }
  }

  protected scanAgain(): void {
    this.result.set(null);
    this.savedAt.set(null);
    this.lastDecoded = '';
    if (!this.running()) void this.start();
  }

  protected async pickFile(): Promise<void> {
    this.fileInput()?.nativeElement.click();
  }

  protected async onFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.error.set('');
    const r = await this.scannerSvc.decodeFile(file);
    if (!r) {
      this.error.set('Could not find a QR code in that image.');
      return;
    }
    this.onDecoded(r);
  }

  protected async copy(text: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    try { await navigator.clipboard.writeText(text); } catch { /* noop */ }
  }

  private onDecoded(r: ScanResult): void {
    if (r.data === this.lastDecoded) return;
    this.lastDecoded = r.data;

    const typeId = this.payloadSvc.classify(r.data);
    const typeLabel = findType(typeId)?.label ?? typeId;
    this.result.set({
      text: r.data,
      typeId,
      typeLabel,
      link: this.toLink(r.data, typeId),
      at: Date.now(),
    });
    this.persist(r.data, typeId);
  }

  private async persist(text: string, typeId: string): Promise<void> {
    if (text === this.lastSavedPayload) return;
    this.lastSavedPayload = text;
    await this.storage.save({
      id: crypto.randomUUID(),
      kind: 'scanned',
      type: typeId as ReturnType<QrPayloadService['classify']>,
      payload: text,
      createdAt: Date.now(),
    });
    this.savedAt.set(Date.now());
  }

  /** Best-effort tappable link for common scan types. */
  private toLink(text: string, typeId: string): string | null {
    if (typeId === 'url' || typeId === 'email' || typeId === 'phone' || typeId === 'sms' || typeId === 'geo') {
      return text;
    }
    if (typeId === 'wifi') return null;
    return null;
  }

  private normaliseError(err: unknown): string {
    if (err instanceof Error) {
      if (/permission/i.test(err.message)) return 'Camera permission was denied.';
      if (/notfound|no camera/i.test(err.message)) return 'No camera was found on this device.';
      return err.message;
    }
    return 'Could not start the camera.';
  }
}
