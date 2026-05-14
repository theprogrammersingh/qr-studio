import type { QrTypeMeta, QrOptions } from './qr.types';

export const QR_TYPES: readonly QrTypeMeta[] = [
  {
    id: 'text',
    label: 'Text',
    description: 'Any plain text up to ~2,900 alphanumeric characters.',
    fields: [
      { name: 'text', label: 'Text', kind: 'textarea', required: true, placeholder: 'Anything…', maxLength: 2900 },
    ],
  },
  {
    id: 'url',
    label: 'URL',
    description: 'A web link. Opens in the device browser when scanned.',
    fields: [
      { name: 'url', label: 'URL', kind: 'url', required: true, placeholder: 'https://example.com' },
    ],
  },
  {
    id: 'email',
    label: 'Email',
    description: 'Pre-filled email — recipient, subject, and body.',
    fields: [
      { name: 'to', label: 'Recipient', kind: 'email', required: true, placeholder: 'name@example.com' },
      { name: 'subject', label: 'Subject', kind: 'text', placeholder: 'Subject (optional)' },
      { name: 'body', label: 'Body', kind: 'textarea', placeholder: 'Message (optional)' },
    ],
  },
  {
    id: 'phone',
    label: 'Phone',
    description: 'Tap-to-call phone number.',
    fields: [
      { name: 'number', label: 'Phone number', kind: 'tel', required: true, placeholder: '+1 555 0100' },
    ],
  },
  {
    id: 'sms',
    label: 'SMS',
    description: 'Pre-composed text message to a number.',
    fields: [
      { name: 'number', label: 'Phone number', kind: 'tel', required: true, placeholder: '+1 555 0100' },
      { name: 'message', label: 'Message', kind: 'textarea', placeholder: 'Message (optional)' },
    ],
  },
  {
    id: 'wifi',
    label: 'Wi-Fi',
    description: 'Connect to a Wi-Fi network without typing the password.',
    fields: [
      { name: 'ssid', label: 'Network name (SSID)', kind: 'text', required: true, placeholder: 'My Network' },
      {
        name: 'encryption',
        label: 'Security',
        kind: 'select',
        required: true,
        defaultValue: 'WPA',
        options: [
          { value: 'WPA', label: 'WPA / WPA2 / WPA3' },
          { value: 'WEP', label: 'WEP' },
          { value: 'nopass', label: 'None (open network)' },
        ],
      },
      { name: 'password', label: 'Password', kind: 'password', placeholder: 'Network password' },
      {
        name: 'hidden',
        label: 'Hidden network',
        kind: 'select',
        defaultValue: 'false',
        options: [
          { value: 'false', label: 'No' },
          { value: 'true', label: 'Yes' },
        ],
      },
    ],
  },
  {
    id: 'vcard',
    label: 'Contact',
    description: 'A vCard 3.0 contact card — name, phone, email, organisation.',
    fields: [
      { name: 'firstName', label: 'First name', kind: 'text', required: true },
      { name: 'lastName', label: 'Last name', kind: 'text' },
      { name: 'org', label: 'Organisation', kind: 'text' },
      { name: 'title', label: 'Job title', kind: 'text' },
      { name: 'phone', label: 'Phone', kind: 'tel' },
      { name: 'email', label: 'Email', kind: 'email' },
      { name: 'url', label: 'Website', kind: 'url' },
      { name: 'address', label: 'Address', kind: 'text', hint: 'Street, City, Region, Postcode, Country' },
    ],
  },
  {
    id: 'geo',
    label: 'Geo location',
    description: 'A latitude / longitude pair. Opens in the device map app.',
    fields: [
      { name: 'lat', label: 'Latitude', kind: 'number', required: true, placeholder: '51.5074' },
      { name: 'lng', label: 'Longitude', kind: 'number', required: true, placeholder: '-0.1278' },
    ],
  },
  {
    id: 'event',
    label: 'Calendar event',
    description: 'A calendar event in iCalendar format.',
    fields: [
      { name: 'title', label: 'Title', kind: 'text', required: true, placeholder: 'Coffee with Sam' },
      { name: 'location', label: 'Location', kind: 'text' },
      { name: 'startDate', label: 'Start date', kind: 'date', required: true },
      { name: 'startTime', label: 'Start time', kind: 'time' },
      { name: 'endDate', label: 'End date', kind: 'date' },
      { name: 'endTime', label: 'End time', kind: 'time' },
      { name: 'description', label: 'Description', kind: 'textarea' },
    ],
  },
] as const;

export const DEFAULT_QR_OPTIONS: QrOptions = {
  errorCorrectionLevel: 'M',
  margin: 2,
  width: 512,
  fgColor: '#0d0f14',
  bgColor: '#ffffff',
};

export function findType(id: string): QrTypeMeta | undefined {
  return QR_TYPES.find((t) => t.id === id);
}
