# Impeccable: Design-Driven Frontend Development Skill

Impeccable is a design-driven development framework that enables AI agents to move beyond generic "AI-generated" aesthetics. It provides a structured vocabulary and specific rules to eliminate **"slop"**—the recognizable tells of model-generated UI—and replace them with professional design disciplines.

---

## 1. Core Methodology

Impeccable operates on the principle of **Desloppification**: clearing the reflexes that make output look generated. It emphasizes real visual vocabulary, slop detection, and live iteration.

### The Two Registers
Manus should automatically detect which "lane" to use based on the task:
- **Brand Mode**: For landing pages, campaigns, and portfolios. Focuses on distinctive type, committed palettes, and image-led heroes.
- **Product Mode**: For app UI, dashboards, and tools. Focuses on density, semantic states, and repeatable components.

### Getting Started Workflow
1. **Initialize Context**: Always run `/impeccable init` or `/impeccable shape` at the start of a project. This creates `PRODUCT.md` (audience, voice, anti-references) and `DESIGN.md` (visual system).
2. **Follow Canonical Sequences**:
   - `shape` → `craft` (Plan then Build)
   - `audit` → `harden` (Technical Check then Fix)
   - `critique` → `polish` (Review then Refine)

---

## 2. Command Reference

Impeccable provides a shared design vocabulary with 23 specific commands.

| Phase | Command | Description |
| :--- | :--- | :--- |
| **Create** | `/impeccable craft` | Design it, then build it in one flow. |
| | `/impeccable shape` | Produce a design brief through discovery/interview. |
| | `/impeccable init` | Start a new project with `PRODUCT.md` and `DESIGN.md`. |
| **Evaluate** | `/impeccable critique` | Design review with scoring and persona tests. |
| | `/impeccable audit` | 5-dimension technical quality check (P0-P3 severity). |
| **Refine** | `/impeccable typeset` | Fix typography (scale, face, hierarchy). |
| | `/impeccable layout` | Fix spacing, rhythm, and structure. |
| | `/impeccable colorize` | Strategic color application for monochrome UIs. |
| | `/impeccable animate` | Purposeful motion for state/feedback. |
| | `/impeccable delight` | Small moments of personality. |
| | `/impeccable bolder` | Push for impact without chaos. |
| | `/impeccable quieter` | Tone down "shouting" designs. |
| | `/impeccable overdrive` | Advanced visuals (shaders, physics, cinematic). |
| **Simplify** | `/impeccable distill` | Ruthless subtraction to the essence. |
| | `/impeccable clarify` | Rewrite UX copy for clarity. |
| | `/impeccable adapt` | Responsive design for all screens. |
| **Harden** | `/impeccable polish` | Meticulous final pass for design system alignment. |
| | `/impeccable optimize` | Performance fixes (LCP, bundle size). |
| | `/impeccable harden` | Production-ready edge cases (i18n, errors, overflow). |
| | `/impeccable onboard` | First-run experiences and empty states. |
| **System** | `/impeccable document` | Generate `DESIGN.md` in Google Stitch format. |
| | `/impeccable extract` | Pull components/tokens into the design system. |
| | `/impeccable live` | Browser-based iteration (BETA). |

---

## 3. Slop & Quality Catalog

Avoid these common AI-generated UI "tells" and general design mistakes.

### Visual & Layout Slop
- **Side-tab accent border**: Thick colored border on one side of a card.
- **Border accent on rounded element**: Thick accent border clashing with corner radius.
- **Glassmorphism abuse**: Excessive blur, glass cards, and glow borders as mere decoration.
- **Cardocalypse**: Cards inside cards inside cards. Use spacing and dividers instead.
- **Monotonous spacing**: Using the same spacing value everywhere without rhythm.
- **Numbered markers**: Using "01 / 02 / 03" as editorial scaffolding when no sequence exists.

### Typography Slop
- **Flat hierarchy**: Font sizes too close together (aim for >1.25 ratio).
- **Inter Everywhere**: Reflexive use of Inter, Geist, or Space Grotesk. Choose distinctive faces.
- **Hero pill chips**: Tiny uppercase letter-spaced labels immediately above headlines.
- **Crushed tracking**: Letter spacing pulled so tight characters lose their shape.
- **Long measures**: Text lines wider than ~80 characters (hard for the eye to track).

### Color & Motion Slop
- **AI Palette**: Purple/violet gradients and cyan-on-dark by default.
- **Gradient text**: Decorative text gradients that kill scannability.
- **Cream reflex**: Reaching for warm beige/cream as the only "tasteful" background.
- **Bounce easing**: Spring physics on UI elements (dialogs, cards) feels dated. Use smooth ease-out.
- **Layout animation**: Animating width/height (causes jank). Use transform/opacity.

### Copy Slop
- **Buzzword overload**: Using "Supercharge", "Empower", "Streamline", or "World-class".
- **Em-dash overuse**: A recognizable AI cadence tell.
- **Aphoristic-cadence**: Repeated short rebuttals or manufactured-contrast sentences.

---

## 4. Best Practices

- **Respect the System**: Inherit existing tokens and components. Do not invent new ones.
- **Real Product Context**: Every command must read `PRODUCT.md` before designing.
- **Opinionated Partner**: Impeccable is an opinionated partner; push back with design reasoning.
- **Avoid Collisions**: Do not use with other generic frontend skills to avoid vocabulary conflicts.
