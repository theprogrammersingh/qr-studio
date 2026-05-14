import { Injectable } from '@angular/core';
import QRCode from 'qrcode';
import type { QrOptions } from '../data/qr.types';

@Injectable({ providedIn: 'root' })
export class QrGeneratorService {
  async toSvg(payload: string, opts: QrOptions): Promise<string> {
    if (!payload) return '';
    return QRCode.toString(payload, {
      type: 'svg',
      errorCorrectionLevel: opts.errorCorrectionLevel,
      margin: opts.margin,
      width: opts.width,
      color: { dark: opts.fgColor, light: opts.bgColor },
    });
  }

  async toPngDataUrl(payload: string, opts: QrOptions): Promise<string> {
    if (!payload) return '';
    return QRCode.toDataURL(payload, {
      type: 'image/png',
      errorCorrectionLevel: opts.errorCorrectionLevel,
      margin: opts.margin,
      width: opts.width,
      color: { dark: opts.fgColor, light: opts.bgColor },
    });
  }
}
