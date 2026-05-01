---
name: toss-invest-design
description: Use this skill to generate well-branded interfaces and assets for Toss Invest (토스증권 / Toss Securities), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping the Toss Invest web console.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation
- `README.md` — full context, content fundamentals, visual foundations, iconography
- `colors_and_type.css` — drop-in CSS variables (Toss Blue, neutrals, Korean-convention up/down, Pretendard fallback for Toss Product Sans)
- `assets/` — logo placeholders
- `ui_kits/console/` — interactive recreation of the Toss Invest web console (Home, Stock detail, Account)
- `preview/` — design-system specimen cards

## Critical Toss-isms not to forget
- **Korean convention:** red = price up, blue = price down. Do not invert.
- **Voice:** sentence case everywhere, second-person, no exclamation, no emoji in UI chrome.
- **Layout:** 3-column desktop console with persistent right rail for user context.
- **Chrome:** flat surfaces with hairline borders; shadows only for hover/popovers/modals.
- **Motion:** fast (120–260ms) `ease-out`; no bouncy springs.
