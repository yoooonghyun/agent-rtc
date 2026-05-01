# Toss Invest Design System

A design system rooted in the visual & content language of **Toss / 토스증권 (Toss Securities)** — Viva Republica's fintech brand — repurposed as a foundation for **building a new console / dashboard product** (not a stock trading app).

The brand DNA (Toss Blue, Pretendard typography, generous whitespace, hairline borders, sentence-case voice) is preserved. Stock-specific patterns (price tickers, buy/sell flows, KOSPI conventions) are intentionally **excluded** — this kit is for general product surfaces.

---

## Sources

- **Live brand reference:** https://www.tossinvest.com / https://toss.im/en
- **Corp site:** https://corp.tossinvest.com/en
- **Design reference:** https://designcompass.org/en/2024/07/19/toss-invest-pc/

No Figma or codebase was attached. Tokens are reconstructed from the public products. **If you have internal Figma / token files, attach them so we can replace inferred values with canonical ones.**

---

## What we're designing for

A **new console page** in the Toss visual language. Think: an internal admin/dashboard, a settings/management surface, an analytics or operations console — anything that needs to feel like a Toss product but isn't a trading screen.

Audience expectation: **calm, friendly, dense-when-it-needs-to-be**. Toss's signature is making complex tools feel approachable through whitespace, plain-language copy, and one bold blue.

---

## Index (manifest of this system)

| File / folder | What's in it |
|---|---|
| `README.md` | This file — context, content, visuals, iconography |
| `SKILL.md` | Cross-compatible Agent Skill front-matter |
| `colors_and_type.css` | CSS custom properties: color scale + type tokens |
| `assets/` | Logo placeholders |
| `preview/` | Design-system specimen cards |
| `ui_kits/console/` | Generic console shell (top bar, left nav, right rail) — non-trading |

---

## CONTENT FUNDAMENTALS

### Voice & tone
- **Promise-led, never feature-led.** Headlines describe an outcome, not a thing.
- **Empathy first, then product.** Name the user's frustration before pitching the fix.
- **Confident understatement.** No exclamation marks, no superlatives.
- **Plainspoken Korean.** Everyday words over Sino-Korean jargon. Short, contraction-friendly sentences in English.

### Person & address
- **"You" → user, "we" → us.** Direct, never corporate.

### Casing
- **Sentence case everywhere** — buttons, nav, headings, modals. Title Case only for proper nouns.

### Length & rhythm
- **Headlines: 2–7 words.** Subheads: one short sentence.
- Short sentences, generous line height (1.5+). Whitespace, not density.

### Emoji
- **Effectively zero in product chrome.** Toss is text-and-icon. Toss Face glyphs appear in marketing, never in UI.

---

## VISUAL FOUNDATIONS

### Palette
- **Brand:** Toss Blue 500 `#3182F6`. Hover `#1B64DA`, pressed `#1A53B0`. Tint surface `#EDF4FE`.
- **Neutrals:** Near-white surfaces (`#FFFFFF`, `#F9FAFB`, `#F2F4F6`); text greys step from `#191F28` → `#4E5968` → `#8B95A1` → `#B0B8C1`.
- **Dark mode:** `#17171C` page → `#202127` surface → `#2B2D36` raised. Text `#F9FAFB` → `#B0B8C1` → `#6B7684`.
- **Status semantics (general product, non-trading):**
  - Success `#00C49A`, Warning `#FF9500`, Error/Destructive `#F04452`, Info — uses brand blue.

### Typography
- **Display & UI:** **Toss Product Sans** (proprietary). Substituted with **Pretendard** — the de-facto Korean web font that closely matches Toss's metrics for both Hangul and Latin.
- **Numbers:** tabular figures everywhere money/metrics appear.
- **No serif.** Hierarchy from weight + size, never from typeface contrast.
- **Line-height:** 1.5+ for body. Korean Hangul is taller than Latin lowercase.
- **Letter-spacing:** small negative tracking on display sizes (`-0.02em` at 32px+), zero on body.

> **Substitution flag:** Toss Product Sans is not publicly distributable. Drop the official woff2 into `fonts/` to swap.

### Spacing & layout
- **4px base unit.** Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80.
- **Console layout:** left nav (240–280px) · main canvas (fluid, max 880–1040px) · optional right context rail (320–360px).
- **Big gutters.** Section padding 32–48px. Cards breathe.

### Backgrounds
- **Solid, near-white.** No full-bleed photography in chrome. No repeating patterns or textures.
- **Illustrations:** flat, geometric, two-to-three colors per illustration, no outlines, generous negative space. Used sparingly — empty states and onboarding.

### Corner radii
- **Buttons:** 10px (md), 12px (lg), 999px (pill — filter chips, segmented controls).
- **Cards:** 16px standard, 20px feature.
- **Inputs:** 12px.
- **Modals:** 20px desktop, full-bleed bottom-sheet on mobile.

### Shadows & elevation
Shadows are **sparing**. Default surface is **flat with hairline borders**.
- `shadow-sm`: card hover only · `shadow-md`: dropdowns/popovers · `shadow-lg`: modals.
- Borders do most of the elevation work: `1px solid #F2F4F6` between cards, `#E5E8EB` for inputs.

### Hover & press
- **Hover:** subtle bg shift — `#F9FAFB` over white, or 4% lighten on colored buttons. **Never** an outline glow or scale-up.
- **Press:** brand button shifts to `#1B64DA` and scales to 0.98 for ~120ms. Cards do not scale; they tint 6%.
- **Active nav item:** filled pill bg `#E8F2FE` with `#3182F6` text.

### Animation
- **Fast, non-bouncy.** 120–260ms with `cubic-bezier(0.4, 0, 0.2, 1)`.
- **No springs on UI controls.** Sheets slide. Modals fade-and-rise 8px.
- **Page transitions:** none. Tab switches are instant; content fades in 120ms.

### Borders
- Hairline `1px` only. `#F2F4F6` (silent), `#E5E8EB` (default), `#D1D6DB` (input rest), focused → 2px brand-blue ring.

### Transparency & blur
- Blur is rare in chrome. Used only for the sticky-bar frosted treatment on marketing pages (`backdrop-filter: blur(12px); rgba(255,255,255,0.85)`).

### Imagery
- **Cool, clean, slightly desaturated.** No grain, no warm filters.

### Layout rules (fixed elements)
- **Top app bar:** 64px tall, fixed, white, hairline bottom border.
- **No FAB** on desktop.

### Cards
- White surface, 16px radius, **no shadow at rest**, hairline border `#F2F4F6`. On hover: `shadow-sm` + border lifts to `#E5E8EB`. Inner padding 20–24px.

---

## ICONOGRAPHY

Toss uses what appears to be a **proprietary in-house icon family** — single-weight, ~1.5–1.75px stroke, rounded line caps and joins, 24px grid. Sits between **Lucide** and **Phosphor "regular"**.

- **Style:** outlined, uniform 1.5–1.75px stroke, rounded terminals, 24×24 native.
- **No filled variants in chrome** — filled icons only for active tab states.
- **Color icons** in marketing — flat, two-to-three colors, no outlines.
- **Toss Face:** proprietary emoji-style glyphs — marketing only, off-limits in product chrome.
- **Unicode arrows / emoji:** avoid. The brand is text-and-icon.

### Substitution policy
- This kit links **Lucide** from CDN as the closest free analog.
- **Flag:** if the official Toss icon set is provided, replace `<i data-lucide>` references; the `Icon` component is the only file that changes.

---

## Caveats

- **No source access.** Tokens are reconstructed from the public surfaces.
- **Toss Product Sans** → Pretendard.
- **Toss icon set** → Lucide.
- **Logo** is a typographic placeholder.
