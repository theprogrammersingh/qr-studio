import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    title: 'QR Studio — generate & scan QR codes',
  },
  {
    path: 'generate',
    loadComponent: () => import('./pages/generate/generate').then((m) => m.Generate),
    title: 'Generate · QR Studio',
  },
  {
    path: 'generate/:type',
    loadComponent: () => import('./pages/generate/generate').then((m) => m.Generate),
  },
  {
    path: 'scan',
    loadComponent: () => import('./pages/scan/scan').then((m) => m.Scan),
    title: 'Scan · QR Studio',
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/history/history').then((m) => m.History),
    title: 'History · QR Studio',
  },
  { path: '**', redirectTo: '' },
];
