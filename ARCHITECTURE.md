# Architecture

This document captures the tech stack, system design, and conventions that any **frontend-only app** in this style should follow — whether it is a portfolio, a QR-code generator, a task manager, or a calculator. The patterns transfer across domains; only the data model and UI change between apps.

The reference implementation in this repo happens to be a portfolio site, but every architectural decision below is generic.

---

## 1. Stack at a glance

| Layer            | Choice                                              | Why                                                                 |
| ---------------- | --------------------------------------------------- | ------------------------------------------------------------------- |
| Framework        | **Angular 21** (latest), standalone APIs, signals    | Mature, batteries-included, modern reactivity without external libs |
| Rendering        | **`@angular/ssr` with prerender at build time**     | Free SEO, zero runtime server cost, instant TTFB                    |
| Server runtime   | **Express 5** (only for dev / optional SSR)         | Smallest viable HTTP layer; static-first deploys skip it entirely   |
| PWA              | **`@angular/service-worker`**                       | Built-in cache strategies, update detection, no Workbox setup       |
| Styling          | **SCSS + CSS custom properties**                    | No CSS-in-JS, no Tailwind, no utility-class soup. Tokens are the API |
| Testing          | **Vitest** + `@angular/build:unit-test`             | Faster than Karma/Jasmine, ESM-native, vitest config-free           |
| Language         | **TypeScript ~5.9**, strict mode                    | —                                                                   |
| Package manager  | npm 11                                              | Default; no lockfile churn from yarn/pnpm                           |
| Node             | 24+                                                 | Required by `@angular/cli` 21                                       |

**No state library.** Signals + services replace NgRx / Redux / Zustand for almost every frontend-only app. If you reach for a state library, justify it.

**No UI library.** No Material, no PrimeNG, no shadcn ports. Components are built locally against the design tokens. This keeps bundles small and the visual identity precise.

**No CSS framework.** Tailwind, UnoCSS, and similar are explicit non-goals. See `DESIGN.md` for the styling system.

---

## 2. Project structure

```
<root>/
├── public/                       — static assets shipped as-is
│   ├── manifest.webmanifest
│   ├── favicon.svg
│   ├── icons/                    — PWA icons (any, maskable, apple-touch)
│   ├── robots.txt                — classic + AI crawler allowlist
│   ├── llms.txt                  — AEO markdown summary
│   ├── humans.txt
│   ├── og-image.svg              — 1200×630 social card
│   └── sitemap.xml
├── src/
│   ├── app/
│   │   ├── core/                 — singletons (services); cross-cutting concerns
│   │   │   ├── *.service.ts
│   │   │   └── ...
│   │   ├── data/                 — types + static source-of-truth content
│   │   │   ├── <domain>.types.ts
│   │   │   └── <domain>.data.ts
│   │   ├── layout/               — site-wide shell components
│   │   │   ├── site-header/
│   │   │   ├── site-footer/
│   │   │   ├── page-header/      — per-page breadcrumb + h1 + lede
│   │   │   └── pwa-prompt/       — PWA install / update toast
│   │   ├── pages/                — routed (lazy-loaded) components
│   │   │   ├── home/
│   │   │   └── <route>/
│   │   ├── sections/             — reusable content blocks shared between pages
│   │   │   ├── <thing>-list/     — accepts an optional `[limit]` signal input
│   │   │   └── ...
│   │   ├── app.config.ts         — application providers
│   │   ├── app.config.server.ts  — server-side providers
│   │   ├── app.routes.ts         — client route table
│   │   ├── app.routes.server.ts  — prerender / SSR route config
│   │   ├── app.ts                — root shell component
│   │   ├── app.html / .scss
│   │   └── app.spec.ts           — landmark smoke test
│   ├── index.html                — meta tags, fonts, icons
│   ├── main.ts / main.server.ts
│   ├── server.ts                 — Express SSR entry (when used)
│   └── styles.scss               — design tokens + global primitives
├── ngsw-config.json              — service worker cache config
├── angular.json                  — builder config + budgets
├── package.json
├── tsconfig*.json
├── DESIGN.md                     — design system + philosophy
└── ARCHITECTURE.md               — this file
```

**Folder roles are strict:**

- **`core/`** — anything that is `{ providedIn: 'root' }`. Services, interceptors, guards. One concern per file.
- **`data/`** — pure TypeScript: types, static data, builder functions. Never imports from Angular.
- **`layout/`** — components that are part of the global shell. Used in `app.html` or by every route.
- **`pages/`** — one folder per route. Lazy-loaded. Owns its own SEO + JSON-LD + data fetches.
- **`sections/`** — reusable building blocks. Each takes inputs and renders a chunk of UI. No routing, no globals.

The same skeleton works for any frontend-only app — only the contents of `data/`, `pages/`, and `sections/` change.

---

## 3. Component conventions

Every component in the system follows the same shape:

```ts
import { Component, ChangeDetectionStrategy, input, signal, computed, inject } from '@angular/core';

@Component({
  selector: 'app-thing',
  changeDetection: ChangeDetectionStrategy.OnPush,   // mandatory
  templateUrl: './thing.html',                       // separate file once > ~10 lines
  styleUrl: './thing.scss',
  // standalone is implicit in Angular 21; do not declare `standalone: true`
  imports: [/* other standalone components / pipes */],
})
export class Thing {
  // Inputs use the signal-based API.
  readonly limit = input<number | undefined>(undefined);

  // Internal state is a signal.
  protected readonly open = signal(false);

  // Derived state uses computed.
  protected readonly visible = computed(() => /* ... */);

  // Dependencies via inject(), not constructor parameters.
  private readonly svc = inject(SomeService);

  protected toggle(): void { this.open.update(v => !v); }
}
```

**Rules:**

- **`ChangeDetectionStrategy.OnPush` is mandatory.** Default change detection is a performance footgun.
- **Use signals, not observables, for component state.** Reach for RxJS only at the I/O boundary (router events, HTTP, DOM events that need throttle/debounce).
- **Use `inject()`, not constructor parameters.** It's the modern idiom and works in field initializers.
- **Templates in `.html` files** once they exceed ~10 lines. Inline only for trivial wrappers.
- **One component per folder.** `thing/` contains `thing.ts`, `thing.html`, `thing.scss`, and optionally `thing.spec.ts`.
- **Selectors are `app-` prefixed.** Configured via `prefix: 'app'` in `angular.json`.
- **No `*ngIf` / `*ngFor`.** Use the control-flow syntax: `@if`, `@for`, `@switch`, `@else`.

---

## 4. State & data layer

### 4.1 State

For a frontend-only app, **signals + plain TypeScript classes are enough.**

| Scope                          | Mechanism                                                |
| ------------------------------ | -------------------------------------------------------- |
| Component-local state          | `signal()` / `computed()`                                |
| Cross-component state          | A `{ providedIn: 'root' }` service exposing signals      |
| Async data (HTTP / fetch)      | `httpResource()`                                         |
| Persisted state (between visits)| `localStorage` / IndexedDB, guarded by `isPlatformBrowser` |
| URL-driven state               | Router params + `toSignal(route.paramMap)`               |

Avoid:

- **NgRx / Redux / Zustand-style stores.** For a frontend-only app under, say, 50k LOC, they cost more than they save.
- **`BehaviorSubject` for component state.** Use a `signal()` instead.
- **Manual subscriptions in templates.** Use signals; if you have an `Observable`, convert with `toSignal()`.

### 4.2 Data layer

**Static content** lives in `data/<domain>.data.ts` as a typed constant. One file is the source of truth; templates and JSON-LD builders read from it.

```ts
// data/tasks.types.ts
export interface Task { id: string; title: string; done: boolean; }

// data/seed-tasks.data.ts
import type { Task } from './tasks.types';
export const SEED_TASKS: Task[] = [ /* ... */ ];
```

**Remote content** uses `httpResource()` from `@angular/common/http`:

```ts
@Injectable({ providedIn: 'root' })
export class ContentService {
  readonly items = httpResource<Item[]>(
    () => 'https://example.com/data.json',
    { defaultValue: [] },
  );
}
```

Why `httpResource()` over `HttpClient.get()`:

- **It participates in stability tracking**, so SSR/prerender waits for fetches before serializing HTML.
- **It transfers state on hydration** via `provideClientHydration()` — the browser never refetches the data that was used during prerender.
- **It's a signal source**, so consumers read `service.items.value()` and changes propagate without subscriptions.

**Local persistence** for things like preferences, drafts, or "last selected" state: wrap `localStorage` access in a service and gate it with `isPlatformBrowser(inject(PLATFORM_ID))`. Never touch storage during SSR — it doesn't exist there.

---

## 5. Routing

### 5.1 Client routes

`src/app/app.routes.ts` is the single client-side route table. Every route is lazy-loaded.

```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '',         loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'tasks',    loadComponent: () => import('./pages/tasks/tasks').then(m => m.Tasks) },
  { path: 'tasks/:id', loadComponent: () => import('./pages/task-detail/task-detail').then(m => m.TaskDetail) },
  { path: '**',       redirectTo: '/' },
];
```

### 5.2 Server / prerender routes

`src/app/app.routes.server.ts` declares the render mode per route. Default for a frontend-only app is **`RenderMode.Prerender`** for everything statically known:

```ts
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '**', renderMode: RenderMode.Prerender },
];
```

For routes with dynamic params that aren't enumerable at build time, fall back to `RenderMode.Server` (SSR per request) or `RenderMode.Client` (no SSR).

### 5.3 Scroll behavior

Configure scroll restoration globally so every navigation lands at the top and back/forward restores position:

```ts
// app.config.ts
provideRouter(
  routes,
  withInMemoryScrolling({
    scrollPositionRestoration: 'top',
    anchorScrolling: 'enabled',
  }),
),
```

### 5.4 Every new route requires three updates

1. Add it to `app.routes.ts`.
2. (If statically renderable) ensure it's covered by `app.routes.server.ts`.
3. List it in `public/sitemap.xml` (and `public/llms.txt` if AEO matters for your app).

---

## 6. Application bootstrap

`src/app/app.config.ts` is the one place every provider gets wired:

```ts
import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'top',
      anchorScrolling: 'enabled',
    })),
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
```

Key choices:

- **`withFetch()`** — use the native Fetch API, not XHR. SSR-compatible, smaller bundle.
- **`withEventReplay()`** — replay user events (clicks, etc.) that happened before hydration completed.
- **`registerWhenStable:30000`** — SW registers 30s after the app reaches stability. Never blocks interactivity.
- **`enabled: !isDevMode()`** — SW only in production. Dev gets fresh code every reload.

---

## 7. SSR & prerendering

### 7.1 Strategy

Default for a frontend-only app:

- **Prerender every route at build time.** Output is static HTML per route.
- **Hydrate on the client.** `provideClientHydration()` reuses the rendered DOM.
- **Skip the SSR server entirely in production** if your routes are all statically renderable. Deploy `dist/<app>/browser/` to any static host (Netlify, Vercel static, S3 + CloudFront, GitHub Pages).
- Run the SSR server only if you have routes that can't be prerendered.

This gives you SEO, instant TTFB, zero runtime cost, and CSR-style interactivity once hydrated.

### 7.2 Server entry — only if needed

If you do run the SSR server (`npm run serve:ssr:<app>`), one line in `src/server.ts` matters more than the rest:

```ts
app.use(express.static(browserDistFolder, {
  maxAge: '1y',
  index: 'index.html',   // ← critical
}));
```

**Why `index: 'index.html'` is critical:** without it, requests to `/` skip the prerendered `index.html` and fall through to the Angular SSR handler, which returns an empty CSR shell. Crawlers then see ~17 kB of nothing instead of your prerendered page.

### 7.3 What works during SSR / prerender

- **`httpResource()` and stable HTTP calls** — participate in stability tracking; the renderer waits.
- **Pure component logic, signals, computed values.**
- **`<time>`, `<address>`, `<dl>`, all semantic HTML.**

### 7.4 What doesn't

- **`window`, `document`, `localStorage`, `sessionStorage`, `navigator`** — guard with `isPlatformBrowser(inject(PLATFORM_ID))`.
- **`DOCUMENT.defaultView` may be null in some SSR contexts** — handle the null case.
- **`setInterval` / `setTimeout` on the global scope** — they leak into the SSR render.

---

## 8. PWA

### 8.1 Service worker

`ngsw-config.json` declares caching strategy. The shape for a typical frontend-only app:

```json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.svg",
          "/icons/*.svg",
          "/manifest.webmanifest",
          "/index.html",
          "/index.csr.html",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "static",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": ["/assets/**", "/og-image.svg", "/robots.txt", "/sitemap.xml"]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "fonts",
      "urls": ["https://fonts.googleapis.com/**", "https://fonts.gstatic.com/**"],
      "cacheConfig": { "strategy": "freshness", "maxSize": 30, "maxAge": "30d", "timeout": "3s" }
    },
    {
      "name": "api",
      "urls": ["https://api.example.com/**"],
      "cacheConfig": { "strategy": "freshness", "maxSize": 20, "maxAge": "7d", "timeout": "4s" }
    }
  ]
}
```

Rules of thumb:

- **`installMode: prefetch`** for the app shell (HTML, CSS, JS, favicon, manifest).
- **`installMode: lazy, updateMode: prefetch`** for media / large static files.
- **`strategy: freshness`** with a short `timeout` for live data (API responses, RSS, JSON feeds).
- **`strategy: performance`** for assets that rarely change (CDN-versioned fonts, images).
- Always set `maxAge` so the cache doesn't grow forever.

### 8.2 Manifest

`public/manifest.webmanifest` checklist:

```json
{
  "name": "Full App Name",
  "short_name": "App",
  "id": "/",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "display_override": ["standalone", "minimal-ui", "browser"],
  "orientation": "natural",
  "background_color": "#...",
  "theme_color": "#...",
  "lang": "en",
  "dir": "ltr",
  "categories": ["..."],
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "maskable" },
    { "src": "/icons/apple-touch-icon.svg", "sizes": "180x180", "type": "image/svg+xml" }
  ],
  "shortcuts": [
    { "name": "Quick Action", "url": "/quick", "description": "..." }
  ]
}
```

**Gotchas:**

- **`"orientation": "any"` overrides the OS rotation-lock setting on Android.** Use `"natural"` to respect it.
- **iOS needs a `apple-touch-icon`** — Android-only icons aren't enough.
- **`"id"` should be set explicitly** so the OS can dedupe installs across `start_url` changes.
- **Maskable icons need 40% safe-area padding** built into the SVG so Android adaptive shapes don't crop the mark.

### 8.3 Install + update prompts

Browsers no longer auto-show install banners. Capture `beforeinstallprompt`, detect iOS Safari, and roll your own UI. The reference `PwaService` in this repo handles:

- Capturing `beforeinstallprompt` for Android/Chrome/Edge.
- Detecting iOS Safari (UA + `MacIntel + maxTouchPoints` for iPad masquerading as Mac).
- Skipping when running standalone (`display-mode: standalone` or `navigator.standalone`).
- Persisting 7-day dismissals in `localStorage`.
- Subscribing to `SwUpdate.versionUpdates` for `VERSION_READY` + `unrecoverable`.
- Re-checking for updates on `ApplicationRef.isStable` (initial) and `visibilitychange → visible` (re-engagement).
- `activateUpdate()` before `location.reload()` so the next page load serves the new SW.

All browser-API access is guarded by `isPlatformBrowser` so it's SSR-safe.

### 8.4 iOS PWA meta

In `index.html`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#..." media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#..." media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="App">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.svg">
<link rel="mask-icon" href="/favicon.svg" color="#...">
<link rel="manifest" href="/manifest.webmanifest">
```

Plus safe-area padding on any sticky header (see DESIGN.md §8).

---

## 9. SEO + AEO

### 9.1 Per-page SEO service

Each routed page owns its SEO payload in `ngOnInit`:

```ts
ngOnInit(): void {
  this.seo.apply({
    title:       'Page title',
    description: 'One-sentence description.',
    canonical:   'https://example.com/this-page/',
    og: { /* ... */ },
    twitter: { /* ... */ },
  });
  this.seo.setJsonLdAll({
    'page-schema': buildPageSchema(/* ... */),
    'breadcrumb':  buildBreadcrumbList(/* ... */),
  });
}
```

`setJsonLdAll(map)` replaces all `<script type="application/ld+json">` blocks in `<head>` — important for SPAs so a previous page's schema doesn't leak through router navigation.

### 9.2 Structured data

Common shapes worth supporting:

- **WebSite** + **WebPage** — applies to most apps.
- **SoftwareApplication** or **WebApplication** — for app-style sites (task manager, QR generator, etc.).
- **BreadcrumbList** — every nested route.
- **FAQPage** — if you have a help / FAQ section. High-value for AEO.
- **Article** / **BlogPosting** — for any long-form content.

### 9.3 AEO files

`public/llms.txt` is the emerging convention for AI crawlers — a clean markdown rendering of your app's content. Keep it in sync with the live UI.

`public/robots.txt` should explicitly **allow** modern AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, OAI-SearchBot, etc.). Default robots.txt files often miss them.

`public/sitemap.xml` lists every prerendered route.

---

## 10. Build configuration

`angular.json` defaults this stack relies on:

```jsonc
"build": {
  "builder": "@angular/build:application",
  "options": {
    "browser": "src/main.ts",
    "server": "src/main.server.ts",
    "tsConfig": "tsconfig.app.json",
    "inlineStyleLanguage": "scss",
    "assets": [{ "glob": "**/*", "input": "public" }],
    "styles": ["src/styles.scss"],
    "outputMode": "server",
    "ssr": { "entry": "src/server.ts" }
  },
  "configurations": {
    "production": {
      "outputHashing": "all",
      "serviceWorker": "ngsw-config.json",
      "budgets": [
        { "type": "initial",           "maximumWarning": "500kB", "maximumError": "1MB"  },
        { "type": "anyComponentStyle", "maximumWarning": "10kB",  "maximumError": "16kB" }
      ]
    },
    "development": {
      "optimization": false,
      "extractLicenses": false,
      "sourceMap": true
    }
  },
  "defaultConfiguration": "production"
}
```

Notes:

- **`anyComponentStyle: 10kB / 16kB`** — component styles can legitimately be larger than Angular's 4 kB default. Move shared primitives into `styles.scss` to keep components under the cap.
- **`initial: 500kB / 1MB`** — keep the initial chunk under 500 kB warning. Anything bigger means a section that should be lazy-loaded isn't.
- **`outputHashing: 'all'`** — content-hashed filenames for cache-busting. Required for the SW asset group strategy.
- **`outputMode: 'server'`** — produces both `browser/` and `server/` output dirs. If you don't need SSR at runtime, set to `'static'`.

---

## 11. Scripts

```jsonc
"scripts": {
  "ng":     "ng",
  "start":  "ng serve",
  "build":  "ng build",
  "watch":  "ng build --watch --configuration development",
  "test":   "ng test",
  "serve:ssr:<app>": "node dist/<app>/server/server.mjs"
}
```

Dev server: `http://localhost:4200`. SSR server (when used): `http://localhost:4000`.

---

## 12. Testing

The minimum:

- **A landmark smoke test** (`app.spec.ts`) that boots the app and asserts the shell renders: `<app-site-header>`, `<main id="main">`, `<app-site-footer>`, the skip link. This catches the entire class of bugs where a missing import or a broken provider takes down every page.
- **One spec per service** that has logic worth verifying (parsers, builders, persistence wrappers).
- **Component specs only where behavior is non-trivial** — don't write specs to verify a template renders an input.

Use Vitest for speed and ESM-native imports. Single-file runs: `npx ng test --include src/app/<thing>.spec.ts`.

---

## 13. Accessibility baseline

These are non-negotiable. Every app in this stack ships with them.

- `<a class="skip-link" href="#main">` as the first focusable element.
- `<main id="main" tabindex="-1">` as the route's container.
- `<nav aria-label="...">` on every nav region. Multiple navs need distinct labels.
- `<time datetime="ISO-8601">` for every visible date.
- `<dl>` for label/value rows, `<address>` for contact, `<button type="button">` for non-submit buttons.
- `:focus-visible` is **restyled**, never removed. The reference style is `outline: 2px solid var(--accent); outline-offset: 3px;`.
- `@media (prefers-reduced-motion: reduce)` clamps all animations to 0.01ms globally; component-level animations must also opt out.
- Color contrast ≥ AA for body text, ≥ AAA for primary headings, ≥ AA for any accent used as text.

See `DESIGN.md` §5 for the focus / skip-link / sr-only CSS.

---

## 14. Performance

Defaults that keep this stack fast:

- **Lazy-load every route.** `loadComponent` per route in `app.routes.ts`.
- **Prerender at build time.** No runtime SSR cost.
- **`provideClientHydration()` with event replay.** No double-render.
- **`httpResource()` for data.** Transfer state from prerender → client.
- **Service worker caching.** Repeat visits are offline-capable.
- **No icon fonts.** Inline SVG only — no extra request, no FOIT.
- **Preconnect + preload** the two font origins; everything else is bundled or same-origin.
- **`display=swap` on fonts.** No invisible text during font load.
- **Component-style budget** keeps individual chunks lean.

Performance budgets are enforced at build time. If you exceed `initial: 1MB`, the build fails — go fix it.

---

## 15. Common pitfalls and fixes

A field guide to the bugs this stack tends to produce. Many were learned the hard way; preserve the fixes.

### 15.1 Serving the empty CSR shell instead of the prerendered HTML

**Symptom:** crawlers and curl see ~17 kB of empty Angular boot HTML, not your prerendered page. Lighthouse complains about LCP.

**Cause:** `express.static(..., { index: false })` in `server.ts`, which is the default Angular CLI scaffold.

**Fix:** set `{ index: 'index.html' }`. Requests to `/` then resolve to the prerendered `index.html` before reaching the Angular fallback handler. (See §7.2.)

### 15.2 PWA rotates even when device rotation-lock is on

**Symptom:** Installed PWA on Android rotates with the device even though the OS rotation lock is enabled.

**Cause:** `"orientation": "any"` in `manifest.webmanifest`. `"any"` is a *capability declaration*, not a default — it tells the OS the app explicitly handles all orientations, which overrides the lock.

**Fix:** `"orientation": "natural"`. Existing installs cache the manifest; reinstalling or waiting ~24h refreshes it.

### 15.3 Sticky header behind the iOS notch

**Symptom:** When installed as a PWA with `apple-mobile-web-app-status-bar-style=black-translucent`, the sticky header sits under the iOS status bar / notch.

**Cause:** `black-translucent` overlays the status bar on the web view by design — but you have to pad the safe area yourself.

**Fix:** Two changes:
1. `viewport-fit=cover` on the viewport meta (required for `env(safe-area-inset-*)` to return non-zero).
2. `padding-block-start: env(safe-area-inset-top)` on the sticky header's `:host`.

Similarly: landscape iPhones need `padding-inline: max(var(--gutter), env(safe-area-inset-left/right))` on the container.

### 15.4 Users on long sessions never see SW updates

**Symptom:** You deploy a new version, but users with the tab open never get prompted to reload.

**Cause:** Angular's `SwUpdate` only checks once on registration by default. No polling, no re-checks.

**Fix:** In your PWA service, subscribe to `swUpdate.versionUpdates` for `VERSION_READY`, then proactively trigger `swUpdate.checkForUpdate()` at the natural re-engagement moments:

- After `ApplicationRef.isStable` becomes `true` (covers returning visits where the SW was already registered).
- On `document.visibilitychange` when `visibilityState === 'visible'` (covers alt-tab back, laptop wake, mobile refocus).

A 30-min `setInterval` is also viable but usually overkill for apps that ship infrequently.

### 15.5 `applyUpdate()` reloads but still serves the old SW

**Symptom:** User clicks the "new version available — reload" button. Page reloads, but the next page load still shows the old version. A second refresh fixes it.

**Cause:** Bare `location.reload()` doesn't tell the SW to activate the new version first.

**Fix:** `await swUpdate.activateUpdate()` *before* `location.reload()`.

### 15.6 Standalone (installed) PWA never gets updates

**Symptom:** Users who have installed the PWA never see the new version, even though they reopen it daily.

**Cause:** A common pattern is to short-circuit the PWA service in standalone mode — but the early return also skips the `SwUpdate` subscriptions.

**Fix:** Skip only the *install prompt* logic in standalone mode. The SW update subscriptions must run regardless of install state — installed users need updates the most.

### 15.7 `httpResource()` refetches on the client after prerender

**Symptom:** The data renders during prerender, then the client refetches it on hydration, causing a flash or unnecessary network traffic.

**Cause:** `provideClientHydration()` is missing, or HttpClient isn't using `withFetch()`.

**Fix:** Both must be present in `app.config.ts`:
- `provideHttpClient(withFetch())`
- `provideClientHydration(withEventReplay())`

### 15.8 `localStorage` / `window` crashes during SSR

**Symptom:** Build/prerender fails with `localStorage is not defined` or `window is not defined`.

**Fix:** Gate every browser-API access:

```ts
private readonly platformId = inject(PLATFORM_ID);

if (isPlatformBrowser(this.platformId)) {
  // ... safe to touch localStorage, window, document
}
```

### 15.9 Prerender doesn't see your new route

**Symptom:** You added a new route and visited it locally, but `dist/<app>/browser/` doesn't contain its HTML file.

**Fix:** Three places to add the route:
1. `src/app/app.routes.ts` (client).
2. `src/app/app.routes.server.ts` (covered by `**` if you use the default `RenderMode.Prerender` catch-all).
3. `public/sitemap.xml` (for discoverability).

---

## 16. Adapting the skeleton to a new app

The folder structure, providers, build config, and conventions stay constant. What changes:

### QR code generator

- `data/` — types for `QrInput` (text, error correction level, size, color, logo).
- `core/qr.service.ts` — accepts an input `Signal<QrInput>`, returns a `computed()` that emits the SVG string.
- `pages/home/` — input form + live SVG preview, "Download SVG" / "Download PNG" buttons.
- No backend. State persists in URL params (`toSignal(route.queryParamMap)`) so QR codes are shareable.
- SEO: `SoftwareApplication` JSON-LD with `applicationCategory: "UtilityApplication"`.

### Task manager

- `data/task.types.ts` — `Task`, `Project`, `Tag`.
- `core/task-store.service.ts` — signal-backed store: `tasks = signal<Task[]>([])`, `add()`, `complete()`, `remove()`. Persists to IndexedDB on every write.
- `pages/tasks/` — list view + create form.
- `pages/tasks/[id]/` — detail view. Use `RenderMode.Client` since IDs aren't known at build time.
- Keyboard shortcuts via `host: { '(document:keydown)': 'onKey($event)' }`.
- SEO: `SoftwareApplication` + a `WebPage` per static route. Detail pages are not indexed.

### Calculator / unit converter

- `data/units.data.ts` — conversion table.
- `core/converter.service.ts` — pure functions, no state.
- `pages/home/` — input + output + unit selectors.
- Everything is a `computed()` chain — no `subscribe()`, no observables.

The architecture is the same in every case. Only the components and data change.

---

## 17. When to break these rules

These conventions are defaults, not laws.

- **Reach for NgRx-style state libraries** if your app has genuinely complex cross-cutting state (collaborative editing, multi-tab sync, undo/redo across unrelated views). Frontend-only apps almost never need this.
- **Skip prerender** if every route is heavily user-specific and SEO doesn't matter (an in-app dashboard, an authoring tool).
- **Skip SSR entirely** if your routes are all statically renderable — deploy to a static host and drop the Express runtime.
- **Skip the service worker** for apps that should always be online (anything that's live-data-only and uncomfortable serving stale results).

If you break a convention, leave a comment explaining why so future-you doesn't undo the decision.
