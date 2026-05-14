export type QrType =
  | 'text'
  | 'url'
  | 'email'
  | 'phone'
  | 'sms'
  | 'wifi'
  | 'vcard'
  | 'geo'
  | 'event';

export type QrErrorLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrFieldOption {
  readonly value: string;
  readonly label: string;
}

export interface QrField {
  readonly name: string;
  readonly label: string;
  readonly kind: 'text' | 'textarea' | 'tel' | 'email' | 'url' | 'number' | 'select' | 'date' | 'time' | 'password';
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly options?: readonly QrFieldOption[];
  readonly hint?: string;
  readonly maxLength?: number;
  readonly defaultValue?: string;
}

export interface QrTypeMeta {
  readonly id: QrType;
  readonly label: string;
  readonly description: string;
  readonly fields: readonly QrField[];
}

export type QrFormValues = Record<string, string>;

export interface QrOptions {
  readonly errorCorrectionLevel: QrErrorLevel;
  readonly margin: number;
  readonly width: number;
  readonly fgColor: string;
  readonly bgColor: string;
}

export interface QrRecord {
  readonly id: string;
  readonly kind: 'generated' | 'scanned';
  readonly type: QrType;
  readonly payload: string;
  readonly values?: QrFormValues;
  readonly options?: QrOptions;
  readonly createdAt: number;
}
