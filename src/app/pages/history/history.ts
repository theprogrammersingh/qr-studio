import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HistoryList } from '../../sections/history-list/history-list';
import { QrStorageService } from '../../core/qr-storage.service';

@Component({
  selector: 'app-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, HistoryList],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History {
  private readonly storage = inject(QrStorageService);

  protected readonly tab = signal<'generated' | 'scanned'>('generated');
  protected readonly bump = signal(0);

  protected select(t: 'generated' | 'scanned'): void {
    this.tab.set(t);
  }

  protected async clearAll(): Promise<void> {
    await this.storage.clear(this.tab());
    this.bump.update((n) => n + 1);
  }
}
