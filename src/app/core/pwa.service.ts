import { ApplicationRef, Injectable, NgZone, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, first } from 'rxjs/operators';

const DISMISS_KEY = 'qr-studio:install-dismissed-at';
const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly appRef = inject(ApplicationRef);
  private readonly zone = inject(NgZone);
  private readonly swUpdate = inject(SwUpdate);

  readonly canInstall = signal(false);
  readonly isIos = signal(false);
  readonly updateReady = signal(false);

  private deferred: BeforeInstallPromptEvent | null = null;

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.isStandalone()) {
      // SW updates still matter; skip only the install prompt logic.
      this.subscribeToUpdates();
      return;
    }

    this.isIos.set(this.detectIos());

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferred = e as BeforeInstallPromptEvent;
      if (!this.recentlyDismissed()) this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.canInstall.set(false);
      this.deferred = null;
    });

    if (this.isIos() && !this.recentlyDismissed()) {
      // iOS Safari has no programmatic prompt — show the manual hint after a delay.
      window.setTimeout(() => this.canInstall.set(true), 4000);
    }

    this.subscribeToUpdates();
  }

  async install(): Promise<void> {
    if (this.deferred) {
      await this.deferred.prompt();
      const { outcome } = await this.deferred.userChoice;
      this.deferred = null;
      if (outcome !== 'accepted') this.recordDismissal();
      this.canInstall.set(false);
    }
  }

  dismiss(): void {
    this.recordDismissal();
    this.canInstall.set(false);
  }

  async applyUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) return;
    await this.swUpdate.activateUpdate();
    location.reload();
  }

  private subscribeToUpdates(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.updateReady.set(true));

    this.appRef.isStable.pipe(first((s) => s)).subscribe(() => {
      this.swUpdate.checkForUpdate().catch(() => undefined);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.zone.run(() => this.swUpdate.checkForUpdate().catch(() => undefined));
      }
    });
  }

  private isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    return Boolean((navigator as unknown as { standalone?: boolean }).standalone);
  }

  private detectIos(): boolean {
    const ua = navigator.userAgent || '';
    if (/iphone|ipad|ipod/i.test(ua)) return true;
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  }

  private recordDismissal(): void {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); }
    catch { /* storage may be unavailable; ignore */ }
  }

  private recentlyDismissed(): boolean {
    try {
      const v = localStorage.getItem(DISMISS_KEY);
      if (!v) return false;
      return Date.now() - Number(v) < DISMISS_WINDOW_MS;
    } catch {
      return false;
    }
  }
}
