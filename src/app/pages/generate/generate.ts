import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { QrTypePicker } from '../../sections/qr-type-picker/qr-type-picker';
import { QrForm } from '../../sections/qr-form/qr-form';
import { QrPreview } from '../../sections/qr-preview/qr-preview';

import { QrPayloadService } from '../../core/qr-payload.service';
import { QrStorageService } from '../../core/qr-storage.service';
import { DEFAULT_QR_OPTIONS, QR_TYPES, findType } from '../../data/qr-types.data';
import type { QrFormValues, QrType, QrOptions } from '../../data/qr.types';

@Component({
  selector: 'app-generate',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, QrTypePicker, QrForm, QrPreview],
  templateUrl: './generate.html',
  styleUrl: './generate.scss',
})
export class Generate {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly payloadSvc = inject(QrPayloadService);
  private readonly storage = inject(QrStorageService);

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  private readonly query  = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly type = computed<QrType>(() => {
    const fromUrl = this.params()?.get('type');
    return (fromUrl && findType(fromUrl)) ? (fromUrl as QrType) : 'text';
  });

  protected readonly typeMeta = computed(() => findType(this.type())!);

  /** Initial form values pulled from the query string (for "Reopen" deep-links). */
  protected readonly initialValues = computed<QrFormValues>(() => {
    const q = this.query();
    if (!q) return {};
    const out: QrFormValues = {};
    for (const f of this.typeMeta().fields) {
      const v = q.get(f.name);
      if (v !== null) out[f.name] = v;
    }
    return out;
  });

  protected readonly values = signal<QrFormValues>({});
  protected readonly options = signal<QrOptions>(DEFAULT_QR_OPTIONS);

  protected readonly payload = computed(() =>
    this.payloadSvc.build(this.type(), this.values())
  );

  protected readonly canSave = computed(() => this.payload().trim().length > 0);
  protected readonly saved = signal(false);

  protected readonly types = QR_TYPES;
  protected readonly errorLevels: ReadonlyArray<{ value: 'L'|'M'|'Q'|'H'; label: string }> = [
    { value: 'L', label: 'L · ~7%' },
    { value: 'M', label: 'M · ~15%' },
    { value: 'Q', label: 'Q · ~25%' },
    { value: 'H', label: 'H · ~30%' },
  ];

  constructor() {
    // Reset the saved flag whenever the underlying payload changes.
    effect(() => {
      this.payload();
      if (this.saved()) this.saved.set(false);
    });
  }

  protected onTypeChange(t: QrType): void {
    void this.router.navigate(['/generate', t]);
  }

  protected onValuesChange(v: QrFormValues): void {
    this.values.set(v);
  }

  protected onErrorLevelChange(ev: Event): void {
    const v = (ev.target as HTMLSelectElement).value as 'L'|'M'|'Q'|'H';
    this.options.update((o) => ({ ...o, errorCorrectionLevel: v }));
  }

  protected onMarginChange(ev: Event): void {
    const v = Number((ev.target as HTMLInputElement).value);
    this.options.update((o) => ({ ...o, margin: Number.isFinite(v) ? v : 2 }));
  }

  protected async save(): Promise<void> {
    if (!this.canSave()) return;
    await this.storage.save({
      id: crypto.randomUUID(),
      kind: 'generated',
      type: this.type(),
      payload: this.payload(),
      values: { ...this.values() },
      options: this.options(),
      createdAt: Date.now(),
    });
    this.saved.set(true);
  }
}
