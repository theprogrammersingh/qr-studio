import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { QR_TYPES } from '../../data/qr-types.data';
import type { QrType } from '../../data/qr.types';

@Component({
  selector: 'app-qr-type-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './qr-type-picker.html',
  styleUrl: './qr-type-picker.scss',
})
export class QrTypePicker implements AfterViewInit, OnDestroy {
  readonly selected = input.required<QrType>();
  readonly typeChange = output<QrType>();

  protected readonly types = QR_TYPES;

  private readonly listRef = viewChild.required<ElementRef<HTMLUListElement>>('list');
  protected readonly canScrollLeft = signal(false);
  protected readonly canScrollRight = signal(false);

  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    const el = this.listRef().nativeElement;
    this.resizeObserver = new ResizeObserver(() => this.updateArrows());
    this.resizeObserver.observe(el);
    queueMicrotask(() => this.updateArrows());
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  protected pick(t: QrType): void { this.typeChange.emit(t); }

  protected onScroll(): void { this.updateArrows(); }

  protected scroll(direction: -1 | 1): void {
    const el = this.listRef().nativeElement;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  }

  private updateArrows(): void {
    const el = this.listRef().nativeElement;
    const max = el.scrollWidth - el.clientWidth;
    this.canScrollLeft.set(el.scrollLeft > 0);
    this.canScrollRight.set(el.scrollLeft < max - 1);
  }
}
