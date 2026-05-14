import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { QR_TYPES } from '../../data/qr-types.data';
import type { QrType } from '../../data/qr.types';

@Component({
  selector: 'app-qr-type-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './qr-type-picker.html',
  styleUrl: './qr-type-picker.scss',
})
export class QrTypePicker {
  readonly selected = input.required<QrType>();
  readonly typeChange = output<QrType>();

  protected readonly types = QR_TYPES;

  protected pick(t: QrType): void { this.typeChange.emit(t); }
}
