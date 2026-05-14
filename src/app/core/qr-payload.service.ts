import { Injectable } from '@angular/core';
import type { QrFormValues, QrType } from '../data/qr.types';

@Injectable({ providedIn: 'root' })
export class QrPayloadService {
  build(type: QrType, values: QrFormValues): string {
    switch (type) {
      case 'text':  return values['text'] ?? '';
      case 'url':   return this.normaliseUrl(values['url'] ?? '');
      case 'email': return this.email(values);
      case 'phone': return `tel:${this.cleanTel(values['number'] ?? '')}`;
      case 'sms':   return this.sms(values);
      case 'wifi':  return this.wifi(values);
      case 'vcard': return this.vcard(values);
      case 'geo':   return `geo:${this.num(values['lat'])},${this.num(values['lng'])}`;
      case 'event': return this.event(values);
    }
  }

  /** Heuristic decoder: turn a scanned string into a recognised type. */
  classify(payload: string): QrType {
    const s = payload.trim();
    if (/^https?:\/\//i.test(s)) return 'url';
    if (/^mailto:/i.test(s)) return 'email';
    if (/^tel:/i.test(s)) return 'phone';
    if (/^smsto:/i.test(s) || /^sms:/i.test(s)) return 'sms';
    if (/^wifi:/i.test(s)) return 'wifi';
    if (/^begin:vcard/i.test(s)) return 'vcard';
    if (/^geo:/i.test(s)) return 'geo';
    if (/^begin:vevent/i.test(s) || /^begin:vcalendar/i.test(s)) return 'event';
    return 'text';
  }

  private normaliseUrl(raw: string): string {
    const v = raw.trim();
    if (!v) return '';
    if (/^[a-z][a-z0-9+\-.]*:/i.test(v)) return v;
    return `https://${v}`;
  }

  private email(v: QrFormValues): string {
    const to = (v['to'] ?? '').trim();
    const params = new URLSearchParams();
    const subject = (v['subject'] ?? '').trim();
    const body = (v['body'] ?? '').trim();
    if (subject) params.set('subject', subject);
    if (body) params.set('body', body);
    const qs = params.toString();
    return `mailto:${to}${qs ? `?${qs}` : ''}`;
  }

  private sms(v: QrFormValues): string {
    const to = this.cleanTel(v['number'] ?? '');
    const msg = (v['message'] ?? '').trim();
    return msg
      ? `SMSTO:${to}:${msg}`
      : `SMSTO:${to}:`;
  }

  private wifi(v: QrFormValues): string {
    const T = (v['encryption'] || 'WPA').toUpperCase();
    const S = this.escapeWifi(v['ssid'] ?? '');
    const P = this.escapeWifi(v['password'] ?? '');
    const H = (v['hidden'] === 'true') ? 'true' : 'false';
    if (T === 'NOPASS') return `WIFI:T:nopass;S:${S};H:${H};;`;
    return `WIFI:T:${T};S:${S};P:${P};H:${H};;`;
  }

  private escapeWifi(s: string): string {
    // Per the Wi-Fi QR spec: escape \, ;, ,, ", :
    return s.replace(/([\\;,":])/g, '\\$1');
  }

  private vcard(v: QrFormValues): string {
    const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
    const fn = [v['firstName'], v['lastName']].filter(Boolean).join(' ').trim();
    const n  = `${v['lastName'] ?? ''};${v['firstName'] ?? ''};;;`;
    if (fn) lines.push(`FN:${this.escapeVcard(fn)}`);
    lines.push(`N:${this.escapeVcard(n)}`);
    if (v['org'])     lines.push(`ORG:${this.escapeVcard(v['org'])}`);
    if (v['title'])   lines.push(`TITLE:${this.escapeVcard(v['title'])}`);
    if (v['phone'])   lines.push(`TEL;TYPE=CELL:${this.cleanTel(v['phone'])}`);
    if (v['email'])   lines.push(`EMAIL:${v['email'].trim()}`);
    if (v['url'])     lines.push(`URL:${this.normaliseUrl(v['url'])}`);
    if (v['address']) lines.push(`ADR:;;${this.escapeVcard(v['address'])}`);
    lines.push('END:VCARD');
    return lines.join('\n');
  }

  private escapeVcard(s: string): string {
    return s.replace(/([\\,;])/g, '\\$1').replace(/\n/g, '\\n');
  }

  private event(v: QrFormValues): string {
    const start = this.icalDateTime(v['startDate'], v['startTime']);
    const end = v['endDate']
      ? this.icalDateTime(v['endDate'], v['endTime'] || v['startTime'])
      : start;
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//qr-studio//EN',
      'BEGIN:VEVENT',
      `UID:${this.uid()}`,
      `DTSTAMP:${this.icalNow()}`,
      `SUMMARY:${this.escapeIcal(v['title'] ?? '')}`,
    ];
    if (v['location'])    lines.push(`LOCATION:${this.escapeIcal(v['location'])}`);
    if (v['description']) lines.push(`DESCRIPTION:${this.escapeIcal(v['description'])}`);
    lines.push(`DTSTART:${start}`, `DTEND:${end}`, 'END:VEVENT', 'END:VCALENDAR');
    return lines.join('\n');
  }

  private escapeIcal(s: string): string {
    return s.replace(/([\\,;])/g, '\\$1').replace(/\n/g, '\\n');
  }

  /** Format a date+optional-time pair as iCal local time (YYYYMMDDTHHMMSS). */
  private icalDateTime(date?: string, time?: string): string {
    const d = (date ?? '').replace(/-/g, '');
    if (!d) return this.icalNow();
    const t = (time ?? '00:00').replace(/:/g, '') + '00';
    return `${d}T${t.slice(0, 6)}`;
  }

  private icalNow(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
      `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
    );
  }

  private uid(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}@qr-studio`;
  }

  private cleanTel(s: string): string {
    return s.replace(/[^\d+]/g, '');
  }

  private num(s: string | undefined): string {
    const n = Number(s);
    return Number.isFinite(n) ? String(n) : '';
  }
}
