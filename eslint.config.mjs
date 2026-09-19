// eslint-config-next 16 ships native flat configs, so no FlatCompat shim.
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * The design-system rules that used to live only in CLAUDE.md.
 *
 * Every one of these was found in the codebase and removed, and every one is
 * the kind of thing that comes back the next time somebody is in a hurry —
 * a prose rule in a readme does not stop a paste. They are warnings, not
 * errors: a warning is visible in the editor and in CI without turning a
 * legitimate exception into a blocked deploy. If you need one, say why in a
 * comment and disable the line.
 *
 * Scoped to the signed-in student surface and the components it is built from
 * — the area this work covers. The teacher console is deliberately outside it:
 * it is still on the legacy `--color-awaken-*` remap that `app/globals.css`
 * calls "a floor, not a licence to skip the redesign", so switching these on
 * there would bury a real regression under forty pre-existing warnings. Widen
 * the glob when that console is migrated.
 */
const designSystemRules = {
  "no-restricted-syntax": [
    "warn",
    {
      // Rule 1: no gradient fills. The two permitted gradients — a protection
      // scrim over imagery and the radial spotlight on a brand surface — are
      // written as inline `style`, not as a Tailwind class, so this catches
      // the fills without catching them.
      selector: "Literal[value=/\\bbg-gradient-to-[a-z]+\\b/]",
      message:
        "No gradient fills (CLAUDE.md, Design system rule 1). Use a flat orange or a flat ink. The only permitted gradients are a protection scrim over imagery and the radial spotlight on a brand surface, both written as inline style.",
    },
    {
      // Rule 2: two radius families, deliberately far apart. Pills for
      // actions, 14/20/28px for containers. Tailwind's own `rounded-lg`
      // (8px) and `rounded-xl` (12px) are neither.
      selector: "Literal[value=/\\brounded-(sm|md|lg|xl|2xl|3xl)\\b/]",
      message:
        "Off-brand corner radius (CLAUDE.md, Design system rule 2). Actions are rounded-full; containers are rounded-ict-md / -card / -panel.",
    },
    {
      // Rule 8: 120ms, 200ms or 340ms, on --ease-ict. Everything else reads
      // as a different product's motion.
      selector: "Literal[value=/\\bduration-(?!\\[(120|200|340)ms\\])(\\[[0-9]+m?s\\]|[0-9]+)/]",
      message:
        "Off-scale transition duration (CLAUDE.md, Design system rule 8). Use duration-[120ms], duration-[200ms] or duration-[340ms] with ease-ict / ease-ict-out.",
    },
    {
      // Rule 8 again: no infinite loops. `animate-spin` on a busy indicator
      // is fine and is not matched here; `animate-ping` and `animate-bounce`
      // are decoration that never stops.
      selector: "Literal[value=/\\banimate-(ping|bounce|pulse)\\b/]",
      message:
        "No infinite decorative animation (CLAUDE.md, Design system rule 8). A 6px StatusDot says 'working on it' without looping forever.",
    },
    {
      // Phase 2's trap, written down: Tailwind resolves a shadow theme value
      // at compile time, so `shadow-ict-card` bakes in the cream world's drop
      // shadow and the `.ict-app` override silently does nothing.
      selector: "Literal[value=/\\bshadow-ict-card\\b(?!\\))/]",
      message:
        "Use shadow-(--shadow-ict-card). The bare utility is resolved at build time, so the .ict-app override never applies and dark cards get a drop shadow they cannot show.",
    },
  ],
};

const config = [
  ...coreWebVitals,
  ...typescript,
  {
    files: [
      "app/(student)/**/*.tsx",
      "components/ds/**/*.tsx",
      "components/syllabus/**/*.tsx",
      "components/subject/**/*.tsx",
      "components/practice/**/*.tsx",
      "components/mockexams/**/*.tsx",
      "components/lab/**/*.tsx",
      "components/packs/**/*.tsx",
      "components/content/**/*.tsx",
      "components/nav/**/*.tsx",
      "components/payments/**/*.tsx",
    ],
    rules: designSystemRules,
  },
  {
    // scripts/ is plain Node with no TS project attached.
    //
    // docs/design-system/ is the supplied design-system brief — illustrative
    // JSX from an external document, not code this project compiles, imports
    // or maintains. Linting it fails the build on someone else's snippet
    // (Button.jsx references an `Arrow` it re-exports but never imports) and
    // otherwise only produces advice about a reference file nobody ships.
    ignores: [".next/**", "node_modules/**", "out/**", "scripts/**", "docs/**"],
  },
];

export default config;
