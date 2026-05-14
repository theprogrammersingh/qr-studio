import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

import { QrGeneratorService } from '../../core/qr-generator.service';
import type { QrOptions } from '../../data/qr.types';

@Component({
  selector: 'app-qr-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './qr-preview.html',
  styleUrl: './qr-preview.scss',
})
export class QrPreview {
  readonly payload = input.required<string>();
  readonly options = input.required<QrOptions>();
  readonly filename = input<string>('qr-code');

  private readonly gen = inject(QrGeneratorService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly svgRaw = signal<string>('');
  protected readonly busy = signal<boolean>(false);
  protected readonly safeSvg = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.svgRaw())
  );
  protected readonly hasPayload = computed(() => this.payload().trim().length > 0);

  constructor() {
    effect(() => {
      const p = this.payload();
      const o = this.options();
      if (!p) { this.svgRaw.set(''); return; }
      this.busy.set(true);
      this.gen.toSvg(p, o)
        .then((svg) => this.svgRaw.set(this.normaliseSvg(svg)))
        .catch(() => this.svgRaw.set(''))
        .finally(() => this.busy.set(false));
    });
  }

  /** Inject viewBox + responsive sizing so the SVG scales to its container. */
  private normaliseSvg(svg: string): string {
    return svg.replace(
      /<svg([^>]*)>/,
      (_, attrs: string) => {
        const cleaned = attrs
          .replace(/\swidth="[^"]*"/i, '')
          .replace(/\sheight="[^"]*"/i, '');
        return `<svg${cleaned} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`;
      },
    );
  }

  protected async downloadSvg(): Promise<void> {
    if (!this.isBrowser || !this.svgRaw()) return;
    const blob = new Blob([this.svgRaw()], { type: 'image/svg+xml' });
    this.triggerDownload(URL.createObjectURL(blob), `${this.filename()}.svg`);
  }

  protected async downloadPng(): Promise<void> {
    if (!this.isBrowser) return;
    const url = await this.gen.toPngDataUrl(this.payload(), this.options());
    if (url) this.triggerDownload(url, `${this.filename()}.png`);
  }

  protected async copyPayload(): Promise<void> {
    if (!this.isBrowser) return;
    try { await navigator.clipboard.writeText(this.payload()); }
    catch { /* user gesture lost or no permission — silently noop */ }
  }

  private triggerDownload(href: string, filename: string): void {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (href.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(href), 0);
  }
}
