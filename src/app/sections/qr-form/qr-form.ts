import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import type { QrFormValues, QrTypeMeta } from '../../data/qr.types';

@Component({
  selector: 'app-qr-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './qr-form.html',
  styleUrl: './qr-form.scss',
})
export class QrForm {
  readonly type = input.required<QrTypeMeta>();
  readonly initial = input<QrFormValues | undefined>(undefined);
  readonly valuesChange = output<QrFormValues>();

  protected readonly values = signal<QrFormValues>({});

  // Build the initial value map any time `type` or `initial` changes.
  private readonly _seed = computed<QrFormValues>(() => {
    const t = this.type();
    const seed: QrFormValues = {};
    for (const f of t.fields) {
      seed[f.name] = this.initial()?.[f.name] ?? f.defaultValue ?? '';
    }
    return seed;
  });

  constructor() {
    effect(() => {
      const seed = this._seed();
      this.values.set(seed);
      this.valuesChange.emit(seed);
    });
  }

  protected onInput(name: string, ev: Event): void {
    const target = ev.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const next = { ...this.values(), [name]: target.value };
    this.values.set(next);
    this.valuesChange.emit(next);
  }

  protected fieldId(name: string): string {
    return `qr-field-${name}`;
  }
}
