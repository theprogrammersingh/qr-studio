# Design System & Philosophy

This document captures the design philosophy, tokens, and primitives that power this site. It is written to be portable: another project can adopt the same language by lifting the tokens, primitives, and rules below.

---

## 1. Philosophy

The site is **editorial, type-led, and terminal-adjacent.** It reads more like a printed publication or a well-kept developer notebook than a typical "modern" web product.

The guiding aesthetic is "code editor meets newspaper": monospaced display type, tabular date columns, hairline rules, one warm accent against a deep base. Decoration is structural — borders, rules, numbered sections — not ornamental.

### What we deliberately don't do

These are not stylistic preferences; they are the signals that make a site read as "generic / AI-shaped." Avoid them:

- **No gradient heroes.** Flat ink on flat paper.
- **No glassmorphism / frosted cards.** A single 8px backdrop-blur on the sticky header is the only allowed use, and only because it preserves legibility over scrolled content.
- **No rounded card grids with drop shadows.** Cards have a 4px max radius, a 1px border, and zero shadow.
- **No emoji-pill rows for tech stacks.** Tags are bordered monospace text, never colored chips.
- **No purple-to-pink CTAs, no neon accents, no rainbow code-block themes.** One accent, used sparingly.
- **No floating shapes, blurs, or animated mesh backgrounds.** A 1px dot grid at 28px spacing is the only background texture.
- **No abbreviated, copywriter-y microcopy.** ("Let's build something great together.") Prefer specific, dry, slightly opinionated sentences.

### What we do

- **One accent color, used sparingly.** Underlines, list markers, hover states, selection, focus rings, the `~/` prompt in the brand mark. Never used for solid button fills as the default.
- **Print-style information design.** Tabular timelines (dates in a fixed left column), numbered sections (`01 — Profile`), `<details>` for archived material.
- **Mono type for structure, sans for prose.** Headings, labels, dates, navigation, brand → monospace. Long-form body text → Inter (or system sans).
- **Type does the work.** Hierarchy comes from size, weight, and family contrast — not from boxes, backgrounds, or color.
- **Hairlines and sharp corners.** Borders are 1px solid `--line`. Radii max out at 4px. Dashed borders (1px) signal soft/secondary separation; solid 1px is structural.

---

## 2. Tokens

All design tokens are CSS custom properties defined on `:root` in `styles.scss`. Two palettes exist — dark (default) and light (`prefers-color-scheme: light`).

### 2.1 Color

Tokens use **semantic names**, not hue names. The same `--accent` slot holds amber in dark mode and raspberry in light mode. Components reference tokens, never literal hex values.

| Token            | Role                                           | Dark      | Light     |
| ---------------- | ---------------------------------------------- | --------- | --------- |
| `--bg`           | Page background                                | `#0d0f14` | `#f5f5f5` |
| `--bg-elev`      | Elevated surfaces — cards, tags, edu blocks    | `#14171e` | `#ececec` |
| `--surface`      | Inset surfaces (one step deeper than elev)     | `#181c25` | `#e3e3e3` |
| `--fg`           | Primary text + headings                        | `#e7e3d6` | `#4a148c` |
| `--fg-soft`      | Body prose, secondary text, descriptions       | `#b9b4a4` | `#006064` |
| `--fg-mute`      | Meta — dates, breadcrumbs, eyebrows            | `#6b675c` | `#6b6b6b` |
| `--line`         | Structural 1px borders, section rules          | `#232732` | `#d6d6d6` |
| `--line-soft`    | Subtle dividers, dot-grid background           | `#1a1d26` | `#e5e5e5` |
| `--accent`       | The single accent — used sparingly             | `#fbbf24` | `#c2185b` |
| `--accent-deep`  | Hover / active state for accent                | `#f59e0b` | `#880e4f` |
| `--link`         | Inline links inside prose                      | `#67e8f9` | `#1565c0` |
| `--link-hover`   | Inline link hover state                        | `#a5f3fc` | `#0d47a1` |
| `--string`       | "Current"/"active" state (semantic green)      | `#9bd06a` | `#2e7d32` |
| `--keyword`      | Reserved code-highlight slot (rose family)     | `#f472b6` | `#ad1457` |
| `--comment`      | Reserved code-highlight slot (muted)           | `#5c6370` | `#6b6b6b` |

**Dark palette character** — cool blue-black background, warm cream foreground, amber accent. The warmth in the text against a cool base is the source of the editorial feel.

**Light palette character** — neutral light gray background, deep purple primary text (13.5:1 AAA), dark cyan secondary text (9.8:1 AAA), raspberry accent (6.5:1 AA). Intentionally not a copy of the dark palette inverted — a distinct identity that shares the "one accent thread, semantic role assignments" structure.

#### Drop-in CSS

```css
:root {
  /* Dark mode — default. Cool blue-black with warm cream foreground. */
  --bg:           #0d0f14;
  --bg-elev:      #14171e;
  --surface:      #181c25;
  --fg:           #e7e3d6;
  --fg-soft:      #b9b4a4;
  --fg-mute:      #6b675c;
  --line:         #232732;
  --line-soft:    #1a1d26;

  --accent:       #fbbf24;   /* amber */
  --accent-deep:  #f59e0b;
  --link:         #67e8f9;   /* cyan */
  --link-hover:   #a5f3fc;
  --string:       #9bd06a;
  --keyword:      #f472b6;
  --comment:      #5c6370;
}

@media (prefers-color-scheme: light) {
  :root {
    --bg:           #f5f5f5;
    --bg-elev:      #ececec;
    --surface:      #e3e3e3;
    --fg:           #4a148c;   /* deep purple — primary text, 13.5:1 AAA */
    --fg-soft:      #006064;   /* dark cyan — secondary text, 9.8:1 AAA */
    --fg-mute:      #6b6b6b;
    --line:         #d6d6d6;
    --line-soft:    #e5e5e5;

    --accent:       #c2185b;   /* raspberry — CTA / accent, 6.5:1 AA */
    --accent-deep:  #880e4f;
    --link:         #1565c0;
    --link-hover:   #0d47a1;
    --string:       #2e7d32;
    --keyword:      #ad1457;
    --comment:      #6b6b6b;
  }
}
```

### 2.2 Building a palette

When porting to a new project, design the palette around three relationships:

1. **Background ↔ foreground contrast.** Body text must clear AA (4.5:1). Primary headings should clear AAA (7:1) — heading sizes don't compensate for low contrast in editorial designs.
2. **Accent ↔ background contrast.** The accent is used for small details (underlines, dots, the `~/` prompt) and must remain readable as text. Aim for AA (≥4.5:1) at minimum.
3. **Bg vs bg-elev vs surface.** Three tonal steps with ~6–8% luminance difference between each. Avoid pure neutral grays — give the surface family a tint (warm or cool) that ties to the foreground story.

The dark palette uses **cool blue-black bg with warm cream foreground and amber accent.** The light palette uses **neutral gray bg with deep purple foreground, dark cyan secondary, and raspberry accent** — a different identity, but the same idea: one accent thread, semantic role assignments, ≥AA contrast throughout.

### 2.3 Type scale

Mobile-first fluid scale, with two breakpoint bumps:

| Step       | Default (mobile) | ≥ 36rem       | ≥ 64rem       |
| ---------- | ---------------- | ------------- | ------------- |
| `--step--1`| `0.78rem`        | —             | —             |
| `--step-0` | `1rem`           | `1rem`        | —             |
| `--step-1` | `1.1rem`         | `1.18rem`     | —             |
| `--step-2` | `1.3rem`         | `1.45rem`     | —             |
| `--step-3` | `1.55rem`        | `1.85rem`     | `2rem`        |
| `--step-4` | `2rem`           | `2.4rem`      | `2.8rem`      |
| `--step-5` | `2.5rem`         | `3.2rem`      | `4rem`        |

Use steps, not raw rem values, for font sizes. `--step--1` is for meta/labels; `--step-0` is body; `--step-5` is the hero name.

#### Drop-in CSS

```css
:root {
  --step--1: 0.78rem;
  --step-0:  1rem;
  --step-1:  1.1rem;
  --step-2:  1.3rem;
  --step-3:  1.55rem;
  --step-4:  2rem;
  --step-5:  2.5rem;
}

@media (min-width: 36rem) {
  :root {
    --step-0:  1rem;
    --step-1:  1.18rem;
    --step-2:  1.45rem;
    --step-3:  1.85rem;
    --step-4:  2.4rem;
    --step-5:  3.2rem;
  }
}

@media (min-width: 64rem) {
  :root {
    --step-3:  2rem;
    --step-4:  2.8rem;
    --step-5:  4rem;
  }
}
```

### 2.4 Spatial tokens

```css
:root {
  --measure:    62ch;                         /* max line length for prose */
  --gutter:     clamp(1rem, 4.5vw, 2rem);     /* container side padding */
  --container:  68rem;                        /* max content width */
}
```

The container uses `padding-inline: max(var(--gutter), env(safe-area-inset-left/right))` so landscape iPhone notches widen the gutter automatically.

### 2.5 Fonts

```css
:root {
  --mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code',
          Consolas, 'Liberation Mono', monospace;
  --sans: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
```

Load Inter (weights 400/500/600/700) and JetBrains Mono (weights 400/500/600) with `display=swap`. Preconnect to `fonts.googleapis.com` and `fonts.gstatic.com`, then preload the stylesheet — this is the only third-party font hop allowed in the system.

**JetBrains Mono is the display face.** All headings, navigation, the brand, dates, labels, and section numbers use `--mono`. This is the most distinctive choice in the system — it gives the entire site a "terminal/editor" character that the warm color palette softens into something editorial rather than purely technical.

**Inter is the body face.** Long-form prose, descriptions, and bullet text use `--sans`. Body prose is rendered at `--step-1` on `>=36rem` for readability.

Georgia italic appears only in the favicon mark and OG image — a quiet nod to print serif tradition that doesn't make it into the running text. If you want a serif voice in your fork, restrict it to those decorative slots.

### 2.6 Base typography rules

These ride on top of the tokens and apply globally. Heading sizes map directly to type-scale steps; weights and letter-spacing are part of the editorial voice.

```css
html {
  font-family: var(--sans);
  font-size: 100%;
  line-height: 1.6;
  color: var(--fg);
  background: var(--bg);
  scroll-behavior: smooth;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body { font-size: var(--step-0); min-height: 100dvh; overflow-x: hidden; }

h1, h2, h3, h4 {
  font-family: var(--mono);
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.15;
  color: var(--fg);
  text-wrap: balance;
}
h1 { font-size: var(--step-5); font-weight: 600; letter-spacing: -0.035em; }
h2 { font-size: var(--step-3); font-weight: 500; }
h3 { font-size: var(--step-1); font-weight: 600; }
h4 { font-size: var(--step-0); font-weight: 600; }

p { max-width: var(--measure); text-wrap: pretty; }

a {
  color: var(--link);
  text-decoration: underline;
  text-decoration-color: color-mix(in oklab, var(--link) 35%, transparent);
  text-decoration-thickness: 1px;
  text-underline-offset: 0.22em;
  transition: color .18s ease, text-decoration-color .18s ease;
}
a:hover { color: var(--link-hover); text-decoration-color: var(--link-hover); }

code, kbd, samp { font-family: var(--mono); font-size: 0.92em; }

::selection { background: var(--accent); color: var(--bg); }
```

### 2.7 Reset + accessibility primitives

The bare minimum the system relies on. Note the global reduced-motion clamp — every component-level animation rides on top of this.

```css
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body, h1, h2, h3, h4, p, ul, ol, dl, figure, blockquote { margin: 0; }
ul, ol { padding: 0; list-style: none; }
img, svg { display: block; max-width: 100%; }
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; padding: 0; }

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 2px;
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

.skip-link {
  position: absolute;
  inset-inline-start: 0.75rem;
  inset-block-start: -100px;
  z-index: 100;
  background: var(--accent);
  color: var(--bg);
  padding: 0.6rem 1rem;
  font-family: var(--mono);
  font-size: var(--step--1);
  text-decoration: none;
  font-weight: 600;
  transition: top .15s ease;
}
.skip-link:focus { inset-block-start: 0.75rem; }

.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}
```

---

## 3. Layout primitives

These class names are shared across the site (live in `styles.scss`). Reuse them rather than re-rolling component-scoped versions.

| Class             | Role                                                     |
| ----------------- | -------------------------------------------------------- |
| `.container`      | Width-capped, gutter-padded wrapper. Always the outermost element of a page section. |
| `.section`        | Vertical rhythm wrapper. `padding-block: clamp(2.25rem, 6vw, 4.5rem)`. |
| `.section-heading`| The `## Section Title` row: mono, bordered bottom, `--step-3`. Optional `.section-heading__hash` (accent) prefix and `.section-heading__ext` (muted) suffix for `// optional context`. |
| `.page-header`    | The breadcrumb + h1 + lede block used at the top of every detail page. |
| `.eyebrow`        | Small mono uppercase-ish label above a heading. |
| `.prose`          | Body-copy wrapper. Constrains max-width, bumps line-height, applies `--fg-soft` color, scales up at `≥36rem`. |
| `.tag-list`       | Bordered mono tags. The replacement for emoji pill rows. |
| `.bullets`        | `<ul>` with `›` markers in `--accent`. |
| `.bullets--inline`| Tags-as-bullets variant for inline meta rows. |
| `.timeline`       | Tabular date-left, content-right list. At `<50rem` collapses to a single column with a left rail + accent square marker. |
| `.talks`          | Dashed-rule separated list. Date-left/title-right pattern. `.talks--compact` for trimmed home-page variant. |
| `.cards`          | 1-col → 2-col responsive grid for projects/articles/OSS. |
| `.card`           | Bordered, sharp-cornered card. Hover: border → accent, lift 2px. Never has a drop shadow. |
| `.edu-grid`       | 1 → 2 col block grid for education / paired content. |
| `.see-more`       | Accent dashed-underline link at the end of a section. |
| `.more`           | `<details>` disclosure block with `[+]` / `[−]` mono marker. Used for archived/older content. |
| `.rule`           | A 1px solid `--line` horizontal divider. |

### When to use which list

- **Timeline** — when items have a date range and a duration matters (work history, community involvement).
- **Talks** — when items have a single date and a tertiary metadata field (talks, speaking history, articles by month).
- **Cards** — when items are atomic objects with a title + description + optional link (projects, articles).
- **Tag list / inline bullets** — when items are atoms with no semantic order (tech stacks, languages).
- **Bullets** — for free prose bullets inside an article block.

---

## 4. Components & UI patterns

### 4.1 Header

Sticky, full-width, backdrop-blurred (8px), with the brand mark at left and primary nav at right. On mobile (`<36rem`), nav collapses to a drawer triggered by a 3-bar toggle button. The drawer slides down from the bar with a `max-height` transition; close on link click, on Escape, or on route change. On `≥36rem`, the inline nav uses underline-on-hover/active (1px accent line scaled from 0 to full width).

Padding-block-start uses `env(safe-area-inset-top)` so the blurred backdrop extends under iOS notches when installed as a PWA.

### 4.2 Footer

Two columns (contact + socials) above a copyright row. Explicit handle/label pairs (`@username — Platform Name`), not iconography alone. Same border + rule treatment as the rest of the site.

### 4.3 Brand mark

A monospace lockup: `~/handle` where the `~/` prompt is rendered in `--accent` and the handle in `--fg`. This is the system's most distinctive single element and appears in the header, the OG image, and (in serif italic) the favicon.

### 4.4 Buttons

Buttons are rare. When they appear (PWA install prompt, update reload), they use **inverted foreground**: `background: var(--fg)`, `color: var(--bg)`, 1px solid `var(--fg)` border, no border-radius (or 0). Hover swaps to `--accent` bg with `--bg` text. This keeps the system free of dedicated "button colors."

### 4.5 Status / disclosure

- **Status indicators** (e.g. "available for talks") use a small accent square or a pulsing dot — never a green checkmark or emoji.
- **Disclosures** use native `<details>` with the `.more` class. The marker is a mono `[+]` / `[−]` toggle, not an SVG chevron.

### 4.6 Notifications & toasts

Fixed bottom (or bottom-right on `≥36rem`) editorial toast: `bg-elev` background, 1px `line` border, 2px top accent rule, mono type, slide-up entry animation. No icons in the body — the title carries the semantic. Always respect `prefers-reduced-motion`.

---

## 5. Accessibility

These are non-negotiable defaults, not enhancements.

- **Skip link** as the first focusable element, jumping to `#main`.
- **Landmark structure**: `<header>` → `<main id="main" tabindex="-1">` → `<footer>`. Every page has one of each.
- **Focus visible** is a 2px solid `--accent` outline at 3px offset, 2px border-radius. Never remove outlines; restyle them.
- **Reduced motion** at the global level: animation and transition durations clamped to `0.01ms` under `prefers-reduced-motion: reduce`. Every component-level animation must also opt out under this query.
- **Color contrast**: body text ≥ AA (4.5:1), primary headings ≥ AAA (7:1), accent-as-text ≥ AA.
- **Semantic HTML first.** `<time datetime>` for dates, `<address>` for contact, `<nav aria-label="...">` for every nav region, `<dl>` for label/value rows.
- **`sr-only` utility** for visually-hidden labels (clip-rect technique, not `display:none`).

---

## 6. Motion

Motion is functional and subtle. Defaults:

- `transition: 0.18s ease` for color, border-color, and opacity changes.
- `transition: 0.25s ease` for max-height (drawer) and slide-up (toast).
- Hover translations cap at 2–3px.
- The only ambient animation is the 1.05s cursor blink in the hero, gated on `prefers-reduced-motion`.

If you need to add motion, ask: does it communicate state change, or is it ornamental? Only the first justifies the motion budget.

---

## 7. Component conventions (Angular-specific)

These are framework-side conventions that reinforce the design system:

- **Standalone components only.** No NgModules.
- **`ChangeDetectionStrategy.OnPush`** on every component.
- **Signals** for component state. Inputs use `input()`, outputs use `output()`, internal state uses `signal()` / `computed()`.
- **Templates are HTML files**, not inline strings, once they exceed ~10 lines.
- **Component styles** are SCSS files. The `anyComponentStyle` budget is **10 kB warn / 16 kB error** — design-system primitives live in `styles.scss` so component-scoped styles stay small.
- **Shared primitives** (`.section`, `.section-heading`, `.timeline`, `.cards`, `.tag-list`, `.bullets`, `.page-header`, etc.) live in the global stylesheet. Component-scoped styles are reserved for genuinely local concerns (the hero, the drawer toggle bars, etc.).
- **No CSS-in-JS, no Tailwind, no utility-class soup.** SCSS + design tokens is the whole styling story.

---

## 8. PWA & device considerations

The site is installable. Design decisions that follow from that:

- `viewport-fit=cover` in the viewport meta — required for `env(safe-area-inset-*)` to return non-zero values.
- The sticky header pads `block-start` with `env(safe-area-inset-top)` so the blurred backdrop covers the iOS notch.
- The `.container` widens its inline padding to `max(var(--gutter), env(safe-area-inset-left/right))` for landscape iPhone notches.
- The manifest uses `"orientation": "natural"` — respects the OS rotation lock. **Do not** use `"any"` (it overrides the lock on Android).
- iOS Safari has no install API, so a platform-specific "Add to Home Screen" prompt is surfaced manually after a delay. Android/Chrome captures `beforeinstallprompt` for the same affordance.
- Apple-specific meta: `apple-mobile-web-app-capable=yes`, `apple-mobile-web-app-status-bar-style=black-translucent`, plus an `apple-touch-icon`.
- A maskable icon (with safe-area padding) lives alongside the standard icon in the manifest for Android adaptive shapes.

---

## 9. Background texture

A single ambient detail: a 1px radial-gradient dot at every 28px on `body`, in `--line-soft`. This evokes graph paper / IDE guides without being a "background pattern." It is the **only** decorative texture in the system. Do not add additional gradients, noise overlays, or animated mesh backgrounds.

```css
body {
  background:
    radial-gradient(circle at 1px 1px, var(--line-soft) 1px, transparent 0)
      0 0 / 28px 28px,
    var(--bg);
}
```

---

## 10. Microcopy

Microcopy carries the personality. Two rules:

1. **Specific over enthusiastic.** "Judging, mentoring, occasionally arguing about scope" beats "Empowering builders to ship great things."
2. **Self-aware over corporate.** "A short note, in case we haven't met." beats "About me."

Avoid "Let's", "Empowering", "Crafting", "Passionate about", em-dashes used as a tonal crutch, and any sentence that would not survive being read aloud by someone who knows you.

---

## 11. Checklist for porting

When applying this system to a new project — everything you need is in this file, no other file required:

1. **Paste the colour tokens.** Section 2.1 → "Drop-in CSS". Adjust hex values to taste but keep the slot names.
2. **Paste the type scale + breakpoint overrides.** Section 2.3 → "Drop-in CSS".
3. **Paste the spatial tokens** (section 2.4) and **font stacks** (section 2.5). Load Inter and JetBrains Mono from Google Fonts, or substitute equivalents.
4. **Paste the base typography rules** (section 2.6) — the `html`, `body`, `h1–h4`, `p`, `a`, `::selection` block.
5. **Paste the reset + accessibility primitives** (section 2.7) — box-sizing reset, margin reset, focus-visible, reduced-motion clamp, `.skip-link`, `.sr-only`.
6. **Add the dot-grid body background** (section 9). The only ambient texture in the system.
7. **Build layout primitives** as listed in section 3. The role descriptions tell you what each class needs to do; the specifics (tabular columns, dashed rules, mono date columns) follow from the philosophy.
8. **Pin one accent color and audit every usage.** If the accent shows up as a button fill or a heading color, you're using it wrong.
9. **Pick fonts before picking colors.** The mono-for-headings choice is the system's signature; swapping to a sans display face changes the entire feel.
10. **Decide your "what we don't do" list early** (section 1) and post it where everyone working on the project can see it.
