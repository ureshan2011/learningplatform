# ICTCAMPUS Design System — reference material

> **This folder is the original design-system brief, kept as reference only.**
> It is not consumed by the app at build time. The live implementation is:
> - Tokens: `app/globals.css` (`--color-ict-*`, `--radius-ict-*`, `--shadow-ict-*`, `--ease-ict*`)
> - Components: `components/ds/index.tsx` (`Button`/`ButtonLink`, `Card`/`CardLink`, `Chip`, `Badge`,
>   `StatusDot`/`StatusChip`, `IconBadge`, `ProgressBar`, `StatCard`, `Avatar`, `Eyebrow`,
>   `SectionHeading`, `PageHeader`, `SectionBar`, `EmptyState`)
> - Icons: `components/ui/Icon.tsx` (Lucide only, line style)
> - Nav shell: `components/nav/AppShell.tsx`
>
> **Before building any new signed-in screen, reach for the components above first** — a raw
> `<div className="rounded-xl border">` is only for the rare case where the thing genuinely isn't
> in `components/ds/` yet, and then add it there rather than one-off styling a page.
>
> This system was written for a fictional New Zealand provider. **ICTCAMPUS here is Sri Lankan
> A/L ICT (Grades 12 & 13).** Ignore the NZ voice/copy examples below (`Kia ora`, `programme`,
> `practise` as a NZ spelling) — the visual system, casing rules and componentry apply, the
> locale and copy do not. See the top-level `CLAUDE.md` "Design system" and "Language" sections
> for how this maps onto the real product, including the Sinhala/English rules.

---

A bold, warm-dark design language for **ICTCAMPUS** — an ICT education provider: courses, modules, practice, tutoring, achievements, plus a marketing site that sells the programmes.

## Sources given

Two JPG style references were supplied (no codebase, no Figma file, no logo files):

- `uploads/468b6849a914874b0b145e3f19013b69.jpg` — a light/cream marketing one-pager (orange + near-black, pill nav, pill CTAs with circular arrow badges, dark "services" panel with 2×2 icon cards, project cards with category eyebrows, a stats strip, testimonial cards, a full-bleed orange CTA band, dark footer).
- `uploads/bbca9f1e2cec6799fdd8ebce1a4a8d96.jpg` — a dark product dashboard for a learning app (left icon rail + labels, search bar, XP/streak chips, cocoa-brown feature banner with big display headline, horizontally scrolling lesson cards, module checklist with circular icon badges, right-hand "Scheduled" column with coloured status dots, an orange upsell card pinned to the bottom of the sidebar).

**Important caveat:** these references are third-party work shown for *visual direction only*. Nothing in this system reproduces their logos, wordmarks, mascots or illustrations. The colour temperature, the pill/soft-square geometry, the orange-on-near-black contrast and the layout archetypes are what carried over.

**No ICTCAMPUS logo was provided.** Everywhere a mark would go, the system renders the wordmark in type: `ICTCAMPUS` set in the display face, `CAMPUS` optionally in orange, or the period-accent lockup (`ictcampus.`). See `assets/README.md`. Please supply real logo files (SVG preferred) and we will swap them in.

**Font substitution flag:** no font binaries were provided. The references use a geometric-humanist grotesque with tight display tracking. Nearest Google Fonts matches are in use:

- **Manrope** (display / headings, weights 700–800)
- **DM Sans** (body / UI, 400–700)
- **JetBrains Mono** (code, module codes, numerals in technical contexts)

If ICTCAMPUS has licensed brand faces, send the files and only `tokens/typography.css` needs editing.

---

## CONTENT FUNDAMENTALS

**Voice:** a confident practitioner talking to a motivated learner. Plain, direct, slightly proud. Never corporate-institutional ("leverage our world-class pedagogy"), never bubbly-edtech ("Yay! You did it! 🎉").

**Person.** Marketing copy is **first person singular or plural about ICTCAMPUS, second person about the reader**: "We teach the stack employers actually run." / "You'll ship four real projects." In-product copy is second person and, where the learner is named, uses the name once at the top: "Kia ora, Emily!" then drops back to "you".

**Casing.**
- Headlines: sentence case, always. `You've completed 5 modules this week` — not Title Case.
- Eyebrows / section kickers: ALL CAPS, 12px, letter-spacing `0.14em`, orange. `FEATURED WORK`, `SERVICES`, `WHAT YOU'LL LEARN`.
- Buttons: sentence case with a capital first word — `View progress`, `Let's talk`, `Upgrade now`. Never ALL CAPS buttons.
- Labels and chips: sentence case. Status words may be capitalised singly: `Group`, `Personal`, `Event`.

**The period.** The signature typographic tic: a full stop closing a big headline, coloured orange. `What I do.` / `Selected projects.` Use it on section headlines and the wordmark lockup, **at most once per screen**, and never on a headline that already ends in a question mark.

**Length.** Display headlines 3–7 words, broken across 2–3 lines by intent (the line break is a design decision, not a wrap). Supporting paragraphs 12–28 words, one sentence, occasionally two. Card body copy ≤ 14 words. Metrics get a number and 1–3 words: `5+ Years experience`, `1,230 XP`, `75%`.

**Numbers.** Always numerals, always with the unit or a `+`: `100+ projects completed`, `10+ countries`, `Module 6`, `7:00–7:40 PM`, `Starts in 3 min`. Use en-dashes in time ranges.

**Verbs to favour:** build, ship, learn, practise, complete, unlock, level up, book, join.
**Words to avoid:** journey, empower, solutions (as a noun for teaching), seamless, cutting-edge, revolutionise, unlock your potential.

**Emoji: no.** Not in UI, not in marketing, not in headings. The brand uses line icons and coloured dots instead. (Exception, narrow: a learner's own free-text content may contain emoji — the system never renders one as a UI affordance.)

**Māori/NZ register.** ICTCAMPUS is NZ-based, so `Kia ora` is an acceptable greeting alternative to `Hi`; use NZ spellings (`practise` as verb, `programme` for a course of study, `organisation`).

**Specific examples of good copy:**
- Hero: `Learn ICT that actually ships.` / sub: `Hands-on programmes in networking, cloud and code — taught by people who've done the job.`
- Empty state: `Nothing scheduled yet. Book a tutoring session and it'll show up here.`
- Error: `That module isn't unlocked yet. Finish Module 5 first.`
- Upsell: `Level up with Plus` / `Upgrade now`
- Progress: `You've completed 5 modules this week`

---

## VISUAL FOUNDATIONS

**Two worlds, one palette.** The system runs a **cream world** (marketing, docs, printed) and a **dark world** (the learning product). Both are built from the same warm orange and the same warm near-black — never a cool grey. Max two background colours per surface: cream `--paper-100` + white cards, or `--ink-900` + `--ink-850` panels. The cocoa-brown `--surface-app-feature` (`#3B211A`) is the one permitted third tone on dark, reserved for a single hero banner per screen.

**Colour.** Orange `--orange-500` `#F4551E` is the only accent, and it is **loud but rationed**: one orange thing per region of the screen (a CTA, a progress fill, an eyebrow, one card). Neutrals do all the structural work. Semantic hues (green/amber/red/blue/violet) appear only as 6px status dots, thin badges and tiny inline labels — never as fills for large areas. No gradient backgrounds anywhere; the only gradients permitted are (a) the black protection gradient over imagery, `--protect-gradient`, and (b) a radial orange "spotlight" behind a cut-out portrait. **Never blue-purple gradients.**

**Type.** Display face at weight 800 with negative tracking (`-0.03em` at display sizes, `-0.02em` for h2/h3). Headlines are big and tight (`--leading-tight` 1.02 at 60px+). Body is DM Sans 400/16px at 1.45. The contrast between an 800-weight 48–60px headline and a 14px muted subhead is the primary typographic gesture. Two-tone headlines are idiomatic: one word in orange inside an otherwise near-black line (`Design that **builds** brands.`).

**Spacing.** 4px base scale. Card interiors 24px (`--gutter-card`); section rhythm 80px (`--gutter-section`) on marketing, 12px (`--gutter-app`) between panels in the app. App sidebar 232px. Content max width 1180px.

**Corner radii.** Two families, deliberately far apart:
- **Pills** (`--radius-pill`) for anything actionable or chip-like: buttons, nav items, tabs, chips, search field, avatars, icon buttons.
- **Soft-squares** for containers: `--radius-card` 20px on cards, `--radius-panel` 28px on large panels/app shell, `--radius-md` 14px on small tiles and icon badges, `--radius-sm` 10px on inputs inside dense forms.
No half-measures — a 4px "slightly rounded" corner is off-brand.

**Cards.** Light world: white fill, no border or a hairline `--border-subtle`, `--shadow-sm` at rest, `--shadow-md` on hover, 20px radius, 24px padding. Featured/portfolio cards instead use a **near-black frame**: `--ink-900` fill with the image inset, 2px dark border, a caps orange eyebrow, a bold white title and a circular orange arrow button bottom-right. Dark world: `--ink-850` fill, 1px `--border-dark` hairline, **no drop shadow** (shadows don't read on near-black — use the `--shadow-inset-dark` top highlight instead), 14–20px radius.

**Buttons.** Solid orange pill with white text, `--shadow-brand`, and — the signature — a **circular badge on the right containing an arrow** (→ for forward, ↗ for outbound/new context), the badge inverted against the button fill. Secondary is a near-black pill with white text; tertiary is text + small circular outline arrow, no fill. Sizes 32 / 40 / 48px tall, horizontal padding 1.25× the height.

**Borders.** Structural lines are hairlines (`1px`) and low-contrast. Emphasis lines are `2px` near-black — used on the framed cards, on the nav pill container, and around cut-out imagery. Dark-world dividers are `1px #2A2321`, i.e. barely visible.

**Shadows.** Warm and soft, never a hard offset. `--shadow-sm` for resting cards, `--shadow-md` for hover lift, `--shadow-lg` for overlays/menus, `--shadow-brand` (orange-tinted) only under orange buttons. On dark surfaces: no outer shadow; use a 1px inset white 4% top highlight.

**Animation.** Fast and calm. `--dur-fast` 120ms for colour/opacity, `--dur-base` 200ms for transforms and card lift, `--dur-slow` 340ms for panel/drawer entrances. Easing is `--ease-standard` `cubic-bezier(.2,.8,.25,1)` for almost everything, `--ease-out` for entrances. **No bounce, no spring overshoot, no infinite loops** (one exception: progress-bar fill animates once, 340ms, ease-out). Entrances are a 8–12px translate plus fade — never scale-from-zero.

**Hover states.** Fills go one step **darker** (`--orange-500` → `--orange-600`; `--ink-900` → `--ink-700` which is lighter because it's on black — i.e. dark surfaces lighten, light surfaces darken). Cards lift: `translateY(-2px)` + shadow step up. Text links shift to `--orange-600`. Icon buttons get a 8%-tint circular background. Opacity-only hovers are used just for already-tinted glyphs (0.7 → 1).

**Press states.** `transform: scale(.97)` (`--press-scale`) plus removal of the lift shadow, 120ms. No colour change on press beyond what hover already applied.

**Focus.** 2px `--orange-400` ring, 2px offset, on `:focus-visible` only.

**Transparency and blur.** Used sparingly and only for layering: sticky app headers over scrolling content (`--blur-panel` 14px + 72% surface), modal scrims (`--overlay-scrim`), and chips floating over imagery. Never as decoration; no frosted cards sitting on a flat background.

**Backgrounds and imagery.** Marketing sections sit on flat cream or flat near-black — no patterns, no noise, no repeating textures. Imagery is **photographic and warm**: real people and real workstations, orange-warm grade, medium contrast; black-and-white portraits are acceptable when placed on the orange radial spotlight. Product/course thumbnails use flat white or flat orange tiles with a **single-colour line illustration** (1.5–2px stroke, near-black on white, white on orange) — line illustrations are the brand's illustrative register, never gradient 3D blobs. Full-bleed images always carry `--protect-gradient` behind overlaid text; small floating labels over images use a solid capsule instead of a gradient.

**Layout rules.** Marketing: single centred 1180px column, sections stacked, one full-bleed orange band near the bottom, dark footer. The nav is a **floating pill bar** — near-black, pill-shaped, centred, fixed at the top with 16px inset, containing the wordmark, pill-highlighted nav items and a CTA. Product: fixed 232px sidebar (dark, wordmark top, nav list, upsell card pinned bottom), fixed top search bar with right-aligned chips + avatar, then a scrollable content region; secondary content in a fixed 288px right column. Nothing is centre-aligned in the product; marketing centres headlines only in the CTA band.

**Numerals and progress.** Progress bars are 6px, pill, `--ink-700` track with an orange fill, percentage as a 14px label to the right. Counters (XP, streak) live in dark pill chips with a small orange glyph.

---

## ICONOGRAPHY

No icon assets were supplied with the references, and the reference sets are third-party. **Substitution flagged:** the system standardises on **Lucide** (CDN), which is the closest available match to the references' style — geometric line icons, uniform 2px stroke (we use 1.75px at 20px and below), round caps, no fills.

Rules:
- **Line only.** Stroke `currentColor`, `stroke-width` 1.75–2, `stroke-linecap="round"`, `stroke-linejoin="round"`. Never a filled/solid icon set, never mixed weights on one screen.
- **Sizes:** 16px (inline with 13–14px text), 20px (nav, list rows, buttons), 24px (page-level actions), 28px inside 44px circular badges.
- **Circular badges** are the brand's icon container: a 40–44px circle, `--surface-brand-soft` fill with an orange glyph on light, or `--ink-800` fill with a white glyph on dark, sometimes with a small orange check dot on the bottom-right for a completed state. Module lists use these.
- **Arrows carry meaning:** `→` (ArrowRight) advances within a flow; `↗` (ArrowUpRight) opens something new or external. Both usually sit in a filled circular badge attached to a button.
- **Status is a dot, not an icon.** A 6px filled circle in a semantic colour + a one-word label, inside a pill.
- **No emoji as icons. No unicode glyphs as icons** (`✓`, `★`, `→` in text) except the arrow characters inside the arrow-badge pattern where a real SVG isn't practical. Star ratings use Lucide `Star` at 16px in orange.
- **Brand mark:** typographic only until real files arrive.

Delivery: `<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>` then `lucide.createIcons()`, or copy individual SVGs. Components in this system take an `icon` prop that accepts a Lucide icon name string.

---

## INDEX

**Root**
- `styles.css` — the single entry point consumers link. `@import` lines only.
- `readme.md` — this file.
- `SKILL.md` — Agent-Skills-compatible entry point.
- `thumbnail.html` — homepage tile.

**Tokens** (`tokens/`)
- `colors.css` — orange ramp, warm ink neutrals, paper/cream, cocoa, semantic hues, plus semantic aliases for surfaces/text/borders/status.
- `typography.css` — font stacks, size/weight/leading/tracking scales, composite `--type-*` roles.
- `spacing.css` — 4px scale, gutters, container and sidebar widths.
- `effects.css` — radii, border widths, shadows, motion easings/durations, blur, scrim, protection gradient.
- `base.css` — element resets and two brand utility classes (`.ict-eyebrow`, `.ict-dot`).

**Foundations cards** (`guidelines/`) — small specimen cards feeding the Design System tab: colour (brand, ink, paper, semantic), type (display, body, mono, eyebrow), spacing, radii, shadows, motion, buttons-in-use.

**Components** (`components/`)
- `core/` — `Button`, `IconButton`, `Chip`, `Badge`, `Card`, `Eyebrow`, `SectionHeading`, `Wordmark`
- `forms/` — `Input`, `SearchField`, `Select`, `Checkbox`, `Switch`
- `data/` — `ProgressBar`, `StatTile`, `IconBadge`, `Avatar`, `AvatarGroup`
- `navigation/` — `NavPill`, `SidebarNav`, `Tabs`

**UI kits** (`ui_kits/`)
- `learning_app/` — dark product: dashboard, module detail, practice, schedule.
- `marketing_site/` — cream one-pager: hero, programmes, featured work, stats, testimonials, CTA band, footer.

**Assets** (`assets/`) — see `assets/README.md`. Currently type-only wordmark; awaiting real logo and imagery.

### Intentional additions
- `Wordmark` — needed because no logo file exists; centralises the type lockup so a real SVG can be dropped in one place later.
- `IconBadge` — the circular-badge icon container appears throughout both references; formalised as a primitive.
- `Eyebrow` / `SectionHeading` — the caps-kicker + big-headline-with-orange-period pair is used on nearly every marketing section.
