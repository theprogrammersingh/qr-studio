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
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

import { QrStorageService } from '../../core/qr-storage.service';
import { findType } from '../../data/qr-types.data';
import type { QrRecord } from '../../data/qr.types';

@Component({
  selector: 'app-history-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './history-list.html',
  styleUrl: './history-list.scss',
})
export class HistoryList {
  readonly kind = input.required<'generated' | 'scanned'>();
  readonly limit = input<number>(20);
  readonly emptyHint = input<string>('Nothing here yet.');
  /** Bump this signal/value to force a reload from IndexedDB. */
  readonly reloadKey = input<number>(0);

  private readonly storage = inject(QrStorageService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly records = signal<QrRecord[]>([]);
  protected readonly loaded = signal(false);
  protected readonly hasItems = computed(() => this.records().length > 0);

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const k = this.kind();
      const n = this.limit();
      this.reloadKey(); // track for reload bumps
      void this.refresh(k, n);
    });
  }

  protected typeLabel(type: string): string {
    return findType(type)?.label ?? type;
  }

  protected formatDate(ms: number): string {
    return new Date(ms).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  }

  protected isoDate(ms: number): string {
    return new Date(ms).toISOString();
  }

  protected snippet(payload: string, max = 90): string {
    const flat = payload.replace(/\s+/g, ' ').trim();
    return flat.length > max ? `${flat.slice(0, max)}…` : flat;
  }

  protected async copy(payload: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    try { await navigator.clipboard.writeText(payload); } catch { /* noop */ }
  }

  protected async remove(id: string): Promise<void> {
    await this.storage.remove(id);
    await this.refresh(this.kind(), this.limit());
  }

  protected async reuse(rec: QrRecord): Promise<void> {
    if (rec.kind !== 'generated' || !rec.values) return;
    const queryParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(rec.values)) {
      if (v) queryParams[k] = v;
    }
    await this.router.navigate(['/generate', rec.type], { queryParams });
  }

  private async refresh(k: 'generated' | 'scanned', n: number): Promise<void> {
    const recs = await this.storage.list(k, n);
    this.records.set(recs);
    this.loaded.set(true);
  }
}
