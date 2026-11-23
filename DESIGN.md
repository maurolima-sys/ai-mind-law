# DESIGN.md — PocketMind AI

> Impeccable visual system. Extracted from `src/styles.css`. Read before any CSS or component work.
> Do not invent new tokens. Extend only with explicit justification.

---

## Typography

| Role               | Value                                                   |
| ------------------ | ------------------------------------------------------- |
| Display / headings | `"Manrope"` — 800 weight, `letter-spacing: -0.035em`    |
| Body / UI          | `"DM Sans"` — 400/500/600/700                           |
| Fallback           | `ui-sans-serif, system-ui, sans-serif`                  |
| Monospace          | `ui-monospace, "SF Mono", monospace` (build info, code) |

### Scale in use (approximate)

- Page title: `clamp(24px, 2.1vw, 30px)` — Manrope 800
- Section heading: `14px` — Manrope 800
- Card heading: `13–14px` — Manrope 800
- Body: `11–12px` — DM Sans 400/600
- Label / meta: `10–11px` — DM Sans 600/700
- Caption / hint: `9–10px` — DM Sans 400

### Rules

- Heading ratio between adjacent levels must be ≥ 1.25×
- Never use Inter, Geist, or Space Grotesk — Manrope + DM Sans are the committed pair
- `letter-spacing: -0.035em` on Manrope display; `letter-spacing: -0.025em` on Manrope headings
- Max line measure: 70–80ch on body copy (`max-width: 70ch`)

---

## Colour tokens

```css
/* Ink scale */
--pm-ink: #132449 /* darkest — page titles, primary labels */ --pm-text: #263b62 /* body text */
  --pm-muted: #637493 /* secondary labels, hints */ --pm-soft: #8795ad /* tertiary, captions */
  --pm-line: #e2e8f1 /* borders, dividers */ /* Brand blue */ --pm-blue: #2857df
  --pm-blue-strong: #1d46c5 --pm-blue-pale: #edf3ff /* Semantic */ --pm-purple: #6747d7
  --pm-green: #13835f --pm-green-pale: #eaf8f1 --pm-amber: #a76508 --pm-amber-pale: #fff5e3
  --pm-red: #b9414a --pm-red-pale: #fff0ef /* Surface */ background: #f5f7fb /* page background */
  card: #ffffff;
```

### Rules

- **Never** use purple/violet gradients or cyan-on-dark — these are AI palette slop
- **Never** use warm beige/cream as a background — cream reflex
- Blue (`--pm-blue`) is the single interactive accent. Do not introduce a second accent colour
- Semantic colours (green, amber, red) are for status only — not decoration
- `--pm-ink` on white passes WCAG AA at all sizes used in the product

---

## Spacing & radius

| Token         | Value                              |
| ------------- | ---------------------------------- |
| `--radius`    | `0.7rem` (11.2px)                  |
| `--radius-sm` | `calc(var(--radius) - 4px)` ≈ 7px  |
| `--radius-md` | `calc(var(--radius) - 2px)` ≈ 9px  |
| `--radius-lg` | `var(--radius)` = 11.2px           |
| `--radius-xl` | `calc(var(--radius) + 4px)` ≈ 15px |

### Spacing rhythm in use

- Card internal padding: `16–18px`
- Section heading padding: `17px 18px 14px`
- Settings field padding: `15px 18px`
- Row padding: `10–12px`
- Gap between cards: `12–14px`
- Gap between rows: `9–12px`

### Rules

- Do not use the same spacing value for every gap — vary by hierarchy
- Prefer `gap` over `margin` for grid/flex children
- `padding-inline: 18px` is the canonical horizontal inset for Settings cards

---

## Elevation & shadow

```css
--shadow-card: 0 1px 2px oklch(0.24 0.05 265 / 0.04), 0 4px 16px -8px oklch(0.24 0.05 265 / 0.08);
```

- Cards use `border: 1px solid var(--pm-line)` + white background — no shadow by default
- Shadow is reserved for overlays, popovers, and tour elements
- **No glassmorphism** — no blur, no frosted glass, no glow borders

---

## Component patterns

### Cards / panels

- Class: `.pm-panel` — `border: 1px solid var(--pm-line); border-radius: 11px; background: #fff`
- No cards inside cards. Use dividers (`border-top: 1px solid var(--pm-line)`) to separate rows
- No side-tab accent borders (thick coloured left border on a card)

### Buttons

| Class                 | Use                                     |
| --------------------- | --------------------------------------- |
| `.pm-button--primary` | Single primary CTA per form/section     |
| `.pm-button--outline` | Secondary actions, independent saves    |
| `.pm-button--dark`    | High-contrast actions (export, confirm) |
| `.pm-button--danger`  | Destructive actions                     |

- `min-height: 36px`, `border-radius: 8px`, `font-size: 12px`, `font-weight: 700`
- Only one `--primary` button visible at a time per card

### Badges

- `.pm-badge` — `border-radius: 999px`, `font-size: 9px`, `font-weight: 700`
- Variants: `--neutral`, `--blue`, `--purple`, `--green`, `--amber`, `--red`
- Use for status, category, and inference source — not decoration

### Accordions (Company Profile)

- Header: `padding: 0.75rem 18px`, `font-size: 0.875rem`, `font-weight: 600`
- Body: `padding: 0 18px 1.25rem`
- Footer: `padding: 1rem 18px 1.25rem`

### Form fields

- Input: `padding: 0.5rem 0.625rem`, `border: 1px solid var(--pm-line)`, `border-radius: 0.375rem`
- Label: `font-size: 0.8125rem`, `font-weight: 600`, `color: var(--pm-ink)`
- Hint: `font-size: 0.75rem`, `color: var(--pm-muted)`
- All inputs: `box-sizing: border-box; width: 100%`

---

## Motion

- Transitions: `0.16s ease` for background/color/border-color
- Tour spotlight: `240ms cubic-bezier(0.22, 1, 0.36, 1)` — smooth ease-out, not spring
- Tour popover: `220ms cubic-bezier(0.22, 1, 0.36, 1)`
- Sidebar collapse: `220ms cubic-bezier(0.22, 1, 0.36, 1)`
- **No bounce/spring easing** on UI elements
- **No layout animation** (width/height) — use transform/opacity only

---

## Slop watchlist for this project

These have been observed or are at risk:

| Slop type                     | Status   | Note                                                                   |
| ----------------------------- | -------- | ---------------------------------------------------------------------- |
| Cardocalypse                  | ⚠️ Risk  | Some screens nest panels inside panels — audit before adding new cards |
| Monotonous spacing            | ⚠️ Risk  | Some sections use identical gap values throughout                      |
| Side-tab accent border        | ✅ Clean | Not present                                                            |
| Glassmorphism                 | ✅ Clean | Not present                                                            |
| AI Palette (purple gradients) | ✅ Clean | Purple exists as semantic token only                                   |
| Bounce easing                 | ✅ Clean | All transitions use ease-out                                           |
| Inter Everywhere              | ✅ Clean | Manrope + DM Sans committed                                            |
| Gradient text                 | ✅ Clean | Not present                                                            |
| Cream reflex                  | ✅ Clean | Background is `#f5f7fb` (cool blue-grey)                               |
| Dual primary CTA              | ✅ Fixed | `94e2a4d` — Company Profile save is now `--outline`                    |
| Label contrast                | ✅ Fixed | `94e2a4d` — CP labels use `--pm-ink`                                   |
| Missing horizontal padding    | ✅ Fixed | Latest commit — CP accordion body + footer                             |

---

## What NOT to do

- Do not add new CSS custom properties without updating this file
- Do not use `#2563eb` (Tailwind blue-600) — use `var(--pm-blue)` (`#2857df`)
- Do not use `#9ca3af` for hints — use `var(--pm-muted)` (`#637493`)
- Do not use `var(--pm-border, #e5e7eb)` fallback in new rules — `--pm-border` is not defined; use `var(--pm-line)` directly
- Do not animate `width` or `height` — use `transform` / `opacity`
- Do not add a second typeface — Manrope + DM Sans only
